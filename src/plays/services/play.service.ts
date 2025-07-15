import { Injectable, NotFoundException } from '@nestjs/common';
import { Between, EntityManager, MoreThanOrEqual } from 'typeorm';
import { Play, PlayStatus } from '../entities/play.entity';
import { UpdatePlayDto } from '../dtos/update-play-dto';
import { AddRunnerEventsDto } from '../dtos/create-runner-events.dto';
import { RunnerEvent } from '../entities/runner-event-entity';
import { GameInningStat } from '@/games/entities/game-inning-stat.entity';
import { PitcherGameParticipation } from '@/games/entities/pitcher-game-participation.entity';
import { GameStat } from '@/games/entities/game-stat.entity';
import { InningHalf } from '@/common/enums/inning-half.enum';
import {
  GameHistory,
  HistoryActionType,
  HistoryStatus,
} from '../entities/game-history.entity';
import { GameCoreService } from '@/games/services/game-core.service';
import { GameScoreboardService } from '@/games/services/game-scoreboard.service';
import { BatterGameParticipation } from '@/games/entities/batter-game-participation.entity';
import { Runner } from '../entities/runner.entity';

@Injectable()
export class PlayService {
  constructor(
    private readonly em: EntityManager,
    private readonly gameCoreService: GameCoreService,
    private readonly gameScoreboardService: GameScoreboardService,
  ) {}

  private async createHistoryEntry(
    em: EntityManager,
    gameId: number,
    actionType: HistoryActionType,
    playId?: number,
    actionData?: any,
    previousState?: any,
  ) {
    // 새로운 액션을 실행할 때 이전의 UNDONE 액션들을 무효화
    await em.update(
      GameHistory,
      { gameId, status: HistoryStatus.UNDONE },
      { status: HistoryStatus.INVALID },
    );

    const historySeq = await em
      .createQueryBuilder(GameHistory, 'h')
      .where('h.gameId = :gameId', { gameId })
      .select('COALESCE(MAX(h.seq), 0)', 'max')
      .getRawOne()
      .then((result) => result.max + 1);

    const history = em.create(GameHistory, {
      gameId,
      seq: historySeq,
      actionType,
      playId,
      actionData,
      previousState,
      status: HistoryStatus.ACTIVE,
    });

    return await em.save(history);
  }

  async createPlay(gameId: number) {
    return await this.em.transaction(async (em) => {
      const gameStat = await em.findOne(GameStat, { where: { gameId } });
      const isTop = gameStat.inningHalf === InningHalf.TOP;
      const seq =
        (
          await em
            .createQueryBuilder(Play, 'p')
            .where('p.gameId = :gameId', { gameId })
            .select('COALESCE(MAX(p.seq), 0)', 'max')
            .getRawOne()
        )?.max + 1;

      const play = em.create(Play, {
        gameId,
        seq,
        batterGpId: isTop
          ? gameStat.awayBatterParticipationId
          : gameStat.homeBatterParticipationId,
        pitcherGpId: isTop
          ? gameStat.homePitcherParticipationId
          : gameStat.awayPitcherParticipationId,
        status: PlayStatus.LIVE,
      });

      const savedPlay = await em.save(play);

      // 히스토리 생성
      await this.createHistoryEntry(
        em,
        gameId,
        HistoryActionType.CREATE_PLAY,
        savedPlay.id,
        {
          seq,
          batterGpId: savedPlay.batterGpId,
          pitcherGpId: savedPlay.pitcherGpId,
        },
      );

      return savedPlay;
    });
  }

  async updatePlay(playId: number, body: UpdatePlayDto) {
    return await this.em.transaction(async (em) => {
      const play = await em.findOne(Play, { where: { id: playId } });

      // 이전 상태 저장
      const previousState = {
        resultCode: play.resultCode,
        status: play.status,
      };

      play.resultCode = body.resultCode;
      play.status = body.status;

      const savedPlay = await em.save(play);

      // 히스토리 생성
      await this.createHistoryEntry(
        em,
        play.gameId,
        HistoryActionType.UPDATE_PLAY_RESULT,
        playId,
        { resultCode: body.resultCode, status: body.status },
        previousState,
      );

      return savedPlay;
    });
  }

  async addRunnerEvents(playId: number, body: AddRunnerEventsDto) {
    return await this.em.transaction(async (em) => {
      const play = await em.findOneByOrFail(Play, { id: playId });

      const inningStat = await em.findOne(GameInningStat, {
        where: {
          gameId: play.gameId,
          inning: play.gameInningStat.inning,
          inningHalf: play.gameInningStat.inningHalf,
        },
      });

      const batterGp = await em.findOne(BatterGameParticipation, {
        where: { id: play.batterGpId },
        relations: ['batterGameStat'],
      });

      const pitcherGp = await em.findOne(PitcherGameParticipation, {
        where: { id: play.pitcherGpId },
        relations: ['pitcherGameStat'],
      });

      // prevBatEvents와 afterBatEvents를 하나의 배열로 합치기
      const allEvents = [
        ...(body.prevBatEvents || []),
        ...(body.afterBatEvents || []),
      ];

      const runnerEvents = allEvents.map((event) =>
        em.create(RunnerEvent, {
          ...event,
          gameId: play.gameId,
          playId,
        }),
      );

      const actualRunnerEvents = runnerEvents.filter((event) => event.isActual);
      const virtualRunnerEvents = runnerEvents.filter(
        (event) => !event.isActual,
      );

      if (actualRunnerEvents.length > 0) {
        for (const event of actualRunnerEvents) {
          if (event.endBase === 'O') {
            inningStat.outs++;
            if (inningStat.outs === 3) {
              inningStat.endSeq = play.seq;
              await this.gameScoreboardService.changeInning(play.gameId);
            }
            await em.save(inningStat);
          } else if (event.startBase === 'B') {
            const runner = em.create(Runner, {
              runnerGp: batterGp,
              responsiblePitcherGp: pitcherGp,
              originPlay: play,
            });
            await em.save(runner);
          }
          if (event.endBase === 'H') {
            inningStat.runs++;
            // afterBatEvents에서 온 이벤트만 RBI 처리
            const isAfterBatEvent = body.afterBatEvents?.some(
              (afterEvent) =>
                afterEvent.runnerGpId === event.runnerGpId &&
                afterEvent.start === event.startBase &&
                afterEvent.end === event.endBase,
            );
            if (isAfterBatEvent) {
              batterGp.batterGameStat.runsBattedIn++;
              await em.save(batterGp);
            }
          }
        }
      }

      if (virtualRunnerEvents.length > 0) {
        inningStat.errorFlag = true;
        await em.save(inningStat);
        for (const event of virtualRunnerEvents) {
          if (event.endBase === 'H') {
            batterGp.batterGameStat.runsBattedIn++;
            await em.save(batterGp);
          }
        }
      }

      const savedEvents = await em.save(runnerEvents);

      // 히스토리 생성
      await this.createHistoryEntry(
        em,
        play.gameId,
        HistoryActionType.ADD_RUNNER_EVENTS,
        playId,
        {
          prevBatEvents: body.prevBatEvents || [],
          afterBatEvents: body.afterBatEvents || [],
          events: allEvents,
        },
      );

      return savedEvents;
    });
  }

  async undo(gameId: number) {
    return await this.em.transaction(async (em) => {
      // 가장 최근 ACTIVE 상태의 히스토리 찾기
      const latestHistory = await em.findOne(GameHistory, {
        where: { gameId, status: HistoryStatus.ACTIVE },
        order: { seq: 'DESC' },
      });

      if (!latestHistory) {
        throw new NotFoundException('Undo할 히스토리가 없습니다.');
      }

      // 히스토리 상태를 UNDONE으로 변경
      latestHistory.status = HistoryStatus.UNDONE;
      await em.save(latestHistory);

      // 액션 타입에 따라 undo 실행
      switch (latestHistory.actionType) {
        case HistoryActionType.CREATE_PLAY:
          // 타석 삭제
          if (latestHistory.playId) {
            await em.delete(RunnerEvent, { playId: latestHistory.playId });
            await em.delete(Play, { id: latestHistory.playId });
          }
          break;

        case HistoryActionType.UPDATE_PLAY_RESULT:
          // 이전 상태로 되돌리기
          if (latestHistory.playId && latestHistory.previousState) {
            const play = await em.findOne(Play, {
              where: { id: latestHistory.playId },
            });
            if (play) {
              play.resultCode = latestHistory.previousState.resultCode;
              play.status = latestHistory.previousState.status;
              await em.save(play);
            }
          }
          break;

        case HistoryActionType.ADD_RUNNER_EVENTS:
          // 주자 이벤트 삭제
          if (latestHistory.playId) {
            await em.delete(RunnerEvent, { playId: latestHistory.playId });
          }
          break;
      }

      return {
        success: true,
        message: 'Undo 완료',
        undoneAction: {
          type: latestHistory.actionType,
          playId: latestHistory.playId,
          seq: latestHistory.seq,
        },
      };
    });
  }

  async redo(gameId: number) {
    return await this.em.transaction(async (em) => {
      // 가장 최근 UNDONE 상태의 히스토리 찾기 (INVALID 제외)
      const latestUndoneHistory = await em.findOne(GameHistory, {
        where: { gameId, status: HistoryStatus.UNDONE },
        order: { seq: 'DESC' },
      });

      if (!latestUndoneHistory) {
        throw new NotFoundException('Redo할 히스토리가 없습니다.');
      }

      // 히스토리 상태를 REDONE으로 변경
      latestUndoneHistory.status = HistoryStatus.REDONE;
      await em.save(latestUndoneHistory);

      // 액션 타입에 따라 redo 실행
      switch (latestUndoneHistory.actionType) {
        case HistoryActionType.CREATE_PLAY:
          // 타석 재생성
          if (latestUndoneHistory.actionData) {
            const play = em.create(Play, {
              gameId,
              seq: latestUndoneHistory.actionData.seq,
              batterGpId: latestUndoneHistory.actionData.batterGpId,
              pitcherGpId: latestUndoneHistory.actionData.pitcherGpId,
              status: PlayStatus.LIVE,
            });
            await em.save(play);
          }
          break;

        case HistoryActionType.UPDATE_PLAY_RESULT:
          // 결과 재적용
          if (latestUndoneHistory.playId && latestUndoneHistory.actionData) {
            const play = await em.findOne(Play, {
              where: { id: latestUndoneHistory.playId },
            });
            if (play) {
              play.resultCode = latestUndoneHistory.actionData.resultCode;
              play.status = latestUndoneHistory.actionData.status;
              await em.save(play);
            }
          }
          break;

        case HistoryActionType.ADD_RUNNER_EVENTS:
          // 주자 이벤트 재생성
          if (latestUndoneHistory.playId && latestUndoneHistory.actionData) {
            const allEvents = [
              ...(latestUndoneHistory.actionData.prevBatEvents || []),
              ...(latestUndoneHistory.actionData.afterBatEvents || []),
            ];
            const events = allEvents.map((event: any) =>
              em.create(RunnerEvent, {
                ...event,
                gameId,
                playId: latestUndoneHistory.playId,
              }),
            );
            await em.save(events);
          }
          break;
      }

      return {
        success: true,
        message: 'Redo 완료',
        redoneAction: {
          type: latestUndoneHistory.actionType,
          playId: latestUndoneHistory.playId,
          seq: latestUndoneHistory.seq,
        },
      };
    });
  }

  async getHistory(gameId: number) {
    const histories = await this.em.find(GameHistory, {
      where: { gameId },
      order: { seq: 'ASC' },
    });

    return {
      gameId,
      histories: histories.map((h) => ({
        id: h.id,
        seq: h.seq,
        actionType: h.actionType,
        playId: h.playId,
        status: h.status,
        createdAt: h.createdAt,
      })),
    };
  }

  async simulateEarnedRuns(inningStat: GameInningStat) {
    const runnerEvents = await this.em.find(RunnerEvent, {
      where: {
        gameId: inningStat.gameId,
        playId: Between(inningStat.startSeq, inningStat.endSeq),
        endBase: 'H',
        isActual: false,
      },
    });

    // for (const event of runnerEvents) {
    //   const pitcherParticipation = await this.em.findOne(
    //     PitcherGameParticipation,
    //     {
    //       where: { id: event.responsiblePitcherGpId },
    //       relations: ['pitcherGameStat'],
    //     },
    //   );
    //   pitcherParticipation.pitcherGameStat.earnedRuns++;
    //   await this.em.save(pitcherParticipation);
    // }
  }

  async rollbackToPlay(playId: number) {
    return await this.em.transaction(async (em) => {
      // 1. 대상 play 조회
      const targetPlay = await em.findOneByOrFail(Play, { id: playId });

      // 2. 해당 play 이후의 모든 play 조회
      const laterPlays = await em.find(Play, {
        where: {
          gameId: targetPlay.gameId,
          seq: MoreThanOrEqual(targetPlay.seq + 1),
        },
        order: { seq: 'DESC' }, // 역순으로 삭제
      });

      // 3. 해당 play 이후의 모든 runner events 삭제
      for (const play of laterPlays) {
        await em.delete(RunnerEvent, { playId: play.id });
      }

      // 4. 해당 play 이후의 모든 play 삭제
      await em.remove(laterPlays);

      // 5. 대상 play를 LIVE 상태로 되돌리기
      targetPlay.status = PlayStatus.LIVE;
      targetPlay.resultCode = null;

      // 6. 대상 play의 runner events 삭제 (타석 결과가 확정되지 않았으므로)
      await em.delete(RunnerEvent, { playId: targetPlay.id });

      // 7. 대상 play 저장
      await em.save(targetPlay);

      // 8. GameStat 업데이트 (현재 타자/투수 정보)
      const gameStat = await em.findOne(GameStat, {
        where: { gameId: targetPlay.gameId },
      });
      if (gameStat) {
        // 롤백된 play의 타자/투수 정보로 되돌리기
        gameStat.homeBatterParticipationId = targetPlay.batterGpId;
        gameStat.awayBatterParticipationId = targetPlay.batterGpId;
        gameStat.homePitcherParticipationId = targetPlay.pitcherGpId;
        gameStat.awayPitcherParticipationId = targetPlay.pitcherGpId;
        await em.save(gameStat);
      }

      return {
        success: true,
        message: `Play ${playId}로 롤백되었습니다.`,
        rollbackedPlaysCount: laterPlays.length,
        currentPlay: {
          id: targetPlay.id,
          seq: targetPlay.seq,
          status: targetPlay.status,
          batterGpId: targetPlay.batterGpId,
          pitcherGpId: targetPlay.pitcherGpId,
        },
      };
    });
  }
}
