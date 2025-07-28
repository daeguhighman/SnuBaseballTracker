import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Play, PlayStatus } from '@/plays/entities/play.entity';
import { GameStat } from '@/games/entities/game-stat.entity';
import { InningHalf } from '@/common/enums/inning-half.enum';
import { UpdatePlayDto } from './dtos/update-play.dto';
import { AddRunnerEventsDto } from './dtos/create-runner-events.dto';
import { PitcherGameStat } from '@/games/entities/pitcher-game-stat.entity';
import { BatterGameStat } from '@/games/entities/batter-game-stat.entity';
import { PlateAppearanceResult } from '@/common/enums/plate-appearance-result.enum';
import { BatterGameParticipation } from '@/games/entities/batter-game-participation.entity';
import { PitcherGameParticipation } from '@/games/entities/pitcher-game-participation.entity';
import { GameInningStat } from '@/games/entities/game-inning-stat.entity';
import { VirtualInningStat } from '@/games/entities/virtual-inning-stat.entity';
import { RunnerEvent } from './entities/runner-event.entity';
import { Runner } from './entities/runner.entity';
import { GameScoreboardService } from '@/games/services/game-scoreboard.service';
import { GameStatsService } from '@/games/services/game-stats.service';
import { GameCoreService } from '@/games/services/game-core.service';
import { Game } from '@/games/entities/game.entity';

@Injectable()
export class PlayService {
  constructor(
    private readonly em: EntityManager,
    private readonly dataSource: DataSource,
    private readonly gameScoreboardService: GameScoreboardService,
    private readonly gameStatsService: GameStatsService,
    private readonly gameCoreService: GameCoreService,
  ) {}

  async createPlay(gameId: number) {
    return await this.em.transaction(async (em) => {
      const gameStat = await em.findOne(GameStat, { where: { gameId } });
      if (!gameStat) throw new NotFoundException('GameStat not found');
      const isTop = gameStat.inningHalf === InningHalf.TOP;
      const { max } = await em
        .createQueryBuilder(Play, 'p')
        .where('p.gameId = :gameId', { gameId })
        .select('COALESCE(MAX(p.seq), 0)', 'max')
        .getRawOne();
      const seq = Number(max) + 1;

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

      // 관중용 스냅샷 push
      await this.gameCoreService.pushSnapshotAudience(gameId, savedPlay.id);

      return savedPlay;
    });
  }

  async updatePlay(playId: number, body: UpdatePlayDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const play = await queryRunner.manager.findOne(Play, {
        where: { id: playId },
      });
      if (!play) throw new NotFoundException('Play not found');

      // Play 상태 및 결과 업데이트
      if (body.status) {
        play.status = body.status;
      }

      if (body.resultCode !== undefined) {
        play.resultCode = body.resultCode;
      }

      // Play 엔티티 저장 (한 번만)
      await queryRunner.manager.save(play);

      const batterParticipationId = play.batterGpId;
      const pitcherParticipationId = play.pitcherGpId;

      // 1. BatterGameStat, BatterStat 업데이트
      const isHit = await this.updateBatterStats(
        queryRunner,
        batterParticipationId,
        body,
      );

      // 2. PitcherGameStat, PitcherStat 업데이트
      await this.updatePitcherStats(queryRunner, pitcherParticipationId, body);

      // 3. GameStat 업데이트
      const gameStat = await queryRunner.manager.findOne(GameStat, {
        where: { gameId: play.gameId },
      });
      if (!gameStat) throw new NotFoundException('GameStat not found');
      const isTopInning = gameStat.inningHalf === InningHalf.TOP;
      if (isHit) {
        isTopInning ? gameStat.awayHits++ : gameStat.homeHits++;
      }
      await queryRunner.manager.save(gameStat);
      await queryRunner.commitTransaction();
      return play;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async addRunnerEvents(playId: number, body: AddRunnerEventsDto) {
    return await this.em.transaction(async (em) => {
      const play = await em.findOne(Play, {
        where: { id: playId },
        relations: ['gameInningStat'],
      });
      if (!play) throw new NotFoundException('Play not found');

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

      // prevBatEvents와 afterBatEvents를 각각 actual/virtual로 나눈다
      const prevBatEvents = body.prevBatEvents || [];
      const afterBatEvents = body.afterBatEvents || [];

      const prevActual = prevBatEvents.filter((e) => e.isActual);
      const prevVirtual = prevBatEvents.filter((e) => !e.isActual);
      const afterActual = afterBatEvents.filter((e) => e.isActual);
      const afterVirtual = afterBatEvents.filter((e) => !e.isActual);

      // RunnerEvent 엔티티 생성
      const makeRunnerEvents = (events) =>
        events.map((event) => {
          const runnerEvent = em.create(RunnerEvent, {
            runnerGpId: event.runnerGpId,
            rbiBatterGpId: event.rbiBatterGpId || null,
            startBase: event.startBase,
            endBase: event.endBase,
            isActual: event.isActual ?? true, // Fix 1: false || true → event.isActual ?? true
            gameId: play.gameId,
            playId,
          });
          return runnerEvent;
        });
      const prevActualEvents = makeRunnerEvents(prevActual);
      const prevVirtualEvents = makeRunnerEvents(prevVirtual);
      const afterActualEvents = makeRunnerEvents(afterActual);
      const afterVirtualEvents = makeRunnerEvents(afterVirtual);

      // 모든 이벤트를 하나의 배열로 합치기
      const allRunnerEvents = [
        ...prevActualEvents,
        ...prevVirtualEvents,
        ...afterActualEvents,
        ...afterVirtualEvents,
      ];

      const actualRunnerEvents = allRunnerEvents.filter(
        (event) => event.isActual,
      );
      const virtualRunnerEvents = allRunnerEvents.filter(
        (event) => !event.isActual,
      );

      for (const event of actualRunnerEvents) {
        if (event.endBase === 'O') {
          inningStat.outs++;

          // 1. 투수의 inningPitchedOuts 1 증가
          if (pitcherGp && pitcherGp.pitcherGameStat) {
            pitcherGp.pitcherGameStat.inningPitchedOuts =
              (pitcherGp.pitcherGameStat.inningPitchedOuts || 0) + 1;
            await em.save(pitcherGp.pitcherGameStat);
          }

          console.log('Debug - outs check:', { outs: inningStat.outs });
          if (inningStat.outs === 3) {
            console.log('Debug - 3 outs reached, calling changeInning');

            // 이닝 재구성 - 3아웃이고 errorFlag가 true이고 runs > 0일 때만 시뮬레이터 준비
            if (
              inningStat.outs === 3 &&
              inningStat.errorFlag &&
              inningStat.runs > 0
            ) {
              console.log(
                'Debug - 3 outs, error flag true, and runs > 0, preparing for inning reconstruction simulation',
              );

              // GameStat을 먼저 조회
              const currentGameStat = await em.findOne(GameStat, {
                where: { gameId: play.gameId },
              });

              // 시뮬레이터 준비를 위한 데이터 수집
              const simulationData = {
                gameId: play.gameId,
                inning: inningStat.inning,
                inningHalf: inningStat.inningHalf,
                currentRuns: inningStat.runs,
                currentOuts: inningStat.outs,
                errorFlag: inningStat.errorFlag,
                // 실제 이벤트들
                actualEvents: [...prevActual, ...afterActual],
                virtualEvents: [...prevVirtual, ...afterVirtual],
                // 주자 상태 (시뮬레이션 시작점)
                runnersOnBase: {
                  first: currentGameStat?.onFirstGpId,
                  second: currentGameStat?.onSecondGpId,
                  third: currentGameStat?.onThirdGpId,
                },
                // 현재 타자/투자 정보
                currentBatter: batterGp?.id,
                currentPitcher: pitcherGp?.id,
              };

              console.log('Debug - Simulation data prepared:', simulationData);

              // TODO: 시뮬레이터 호출 또는 큐에 추가
              // await this.prepareInningReconstruction(simulationData);
            }

            // Fix 2: 같은 em을 사용하도록 수정
            await this.gameScoreboardService.changeInning(
              play.gameId,
              em,
              play.seq,
            );
            console.log(
              'Debug - changeInning completed, inningStat:',
              inningStat,
            );
          }
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
          // 2. 주자(BatterGameStat)의 runs 1 증가
          if (event.runnerGpId && batterGp && batterGp.batterGameStat) {
            batterGp.batterGameStat.runs =
              (batterGp.batterGameStat.runs || 0) + 1;
            await em.save(batterGp.batterGameStat);
          }
          // 2. 투수(PitcherGameStat)의 allowedRuns 1 증가
          if (pitcherGp && pitcherGp.pitcherGameStat) {
            pitcherGp.pitcherGameStat.allowedRuns =
              (pitcherGp.pitcherGameStat.allowedRuns || 0) + 1;
            await em.save(pitcherGp.pitcherGameStat);
          }
        }
      }

      // 이닝 재구성 - 에러 플래그 설정 로직
      let hasError = false;
      let errorFlagChanged = false;

      // GameStat을 먼저 조회 (버츄얼 이닝 스탯 생성에 필요)
      const currentGameStat = await em.findOne(GameStat, {
        where: { gameId: play.gameId },
      });

      // 현재 errorFlag 상태 확인
      const currentErrorFlag = inningStat.errorFlag;
      console.log('Debug - Current error flag status:', currentErrorFlag);

      // 1. Virtual 이벤트가 있으면 에러 플래그 설정
      if (afterVirtual.length > 0 || prevVirtual.length > 0) {
        // 에러 플래그가 처음으로 true로 바뀌는지 확인
        if (!currentErrorFlag) {
          errorFlagChanged = true;
          console.log(
            'Debug - Error flag changed from false to true, creating virtual inning stat',
          );

          // 현재 이닝 스탯의 값들을 버츄얼 이닝 스탯으로 복사
          const virtualInningStat = em.create(VirtualInningStat, {
            game: { id: play.gameId },
            gameId: play.gameId,
            inning: inningStat.inning,
            inningHalf: inningStat.inningHalf,
            runs: inningStat.runs,
            outs: inningStat.outs,
            onFirstGpId: currentGameStat?.onFirstGpId,
            onSecondGpId: currentGameStat?.onSecondGpId,
            onThirdGpId: currentGameStat?.onThirdGpId,
            originalInningStatId: inningStat.id,
          });

          await em.save(virtualInningStat);
          console.log('Debug - Virtual inning stat created:', {
            id: virtualInningStat.id,
            inning: virtualInningStat.inning,
            inningHalf: virtualInningStat.inningHalf,
            runs: virtualInningStat.runs,
            outs: virtualInningStat.outs,
          });
        } else {
          console.log(
            'Debug - Error flag already true, skipping virtual inning stat creation',
          );
        }

        inningStat.errorFlag = true;
        console.log('Debug - Inning error flag set to true');
      }

      // 2. Actual과 Virtual 간의 불일치 체크
      const actualRuns = afterActual.filter((event) => event.endBase === 'H');
      const virtualRuns = afterVirtual.filter((event) => event.endBase === 'H');

      // O(1) 조회를 위한 Set 생성
      const virtualRunnerIds = new Set(afterVirtual.map((v) => v.runnerId));
      const virtualRunIds = new Set(virtualRuns.map((v) => v.runnerId));

      // RBI 계산을 위한 카운터
      let rbiDelta = 0;

      for (const actualRun of actualRuns) {
        const hasVirtualEvent = virtualRunnerIds.has(actualRun.runnerId);
        const scoredVirtually = virtualRunIds.has(actualRun.runnerId);

        // virtual이 없으면 타점 인정, virtual이 있으면 virtual에서도 득점이 일어나야 타점 인정
        const shouldCountRBI = !hasVirtualEvent || scoredVirtually;

        if (shouldCountRBI) {
          rbiDelta++;
        }
      }

      // 배터 스탯 존재 여부를 루프 외부에서 한 번만 체크
      if (rbiDelta > 0 && batterGp?.batterGameStat) {
        // 원자적 증가를 위해 increment 사용
        await em.increment(
          'BatterGameStat',
          { id: batterGp.batterGameStat.id },
          'runsBattedIn',
          rbiDelta,
        );

        console.log('Debug - RBI counted for batter:', {
          rbiDelta,
          totalRBI: (batterGp.batterGameStat.runsBattedIn || 0) + rbiDelta,
        });
      }
      await em.save(inningStat);

      // GameStat의 주자 슬롯 업데이트 (RunnerEvent 분석 기반)
      const allActualEvents = [...prevActual, ...afterActual];

      const gameStat = await em.findOne(GameStat, {
        where: { gameId: play.gameId },
      });
      if (gameStat) {
        let bases = {
          1: gameStat.onFirstGpId,
          2: gameStat.onSecondGpId,
          3: gameStat.onThirdGpId,
        };

        for (const event of allActualEvents) {
          const { runnerId, startBase, endBase } = event;

          if (startBase === 'B' && ['1', '2', '3'].includes(endBase)) {
            // 타자가 베이스로 진루
            bases[Number(endBase)] = runnerId;
          } else if (startBase === 'B' && endBase === 'H') {
            // Fix 3: 타자 홈런 케이스 추가
          } else if (
            ['1', '2', '3'].includes(startBase) &&
            ['1', '2', '3'].includes(endBase)
          ) {
            // 주자가 베이스 간 이동 (도루, 진루 등)
            // Fix 4: 타입 안전성을 위해 느슨한 비교 사용
            if (String(bases[Number(startBase)]) === String(runnerId)) {
              bases[Number(startBase)] = null;
            }
            bases[Number(endBase)] = runnerId;
          } else if (
            ['1', '2', '3'].includes(startBase) &&
            (endBase === 'H' || endBase === 'O')
          ) {
            // 주자가 홈으로 들어오거나 아웃
            // Fix 4: 타입 안전성을 위해 느슨한 비교 사용
            if (String(bases[Number(startBase)]) === String(runnerId)) {
              bases[Number(startBase)] = null;
            }
          }
        }

        gameStat.onFirstGpId = bases[1] ?? null;
        gameStat.onSecondGpId = bases[2] ?? null;
        gameStat.onThirdGpId = bases[3] ?? null;

        // 다음 타자 찾기 및 업데이트
        const nextBatter = await this.findNextBatter(em, play.gameId, gameStat);
        if (nextBatter) {
          // 현재 이닝이 TOP이면 원정팀, BOT이면 홈팀이 공격
          if (gameStat.inningHalf === 'TOP') {
            gameStat.awayBatterParticipationId = nextBatter.id;
          } else {
            gameStat.homeBatterParticipationId = nextBatter.id;
          }
        }

        await em.save(gameStat);
        await em.save(allRunnerEvents);
      }

      // GameStat을 다시 조회하여 최신 데이터로 업데이트
      const updatedGameStat = await em.findOne(GameStat, {
        where: { gameId: play.gameId },
      });

      // Game을 조회하여 makePlaySnapshotUmpire에 전달
      const game = await em.findOne(Game, {
        where: { id: play.gameId },
        relations: [
          'homeTeam.team',
          'awayTeam.team',
          'gameStat',
          'inningStats',
          'batterGameParticipations',
          'batterGameParticipations.playerTournament',
          'batterGameParticipations.playerTournament.player',
          'batterGameParticipations.batterGameStat',
          'pitcherGameParticipations',
          'pitcherGameParticipations.playerTournament',
          'pitcherGameParticipations.playerTournament.player',
          'pitcherGameParticipations.pitcherGameStat',
        ],
      });

      if (!game) {
        throw new NotFoundException('Game not found');
      }

      // 업데이트된 GameStat 데이터를 Game 객체에 반영
      if (updatedGameStat) {
        game.gameStat.onFirstGpId = updatedGameStat.onFirstGpId;
        game.gameStat.onSecondGpId = updatedGameStat.onSecondGpId;
        game.gameStat.onThirdGpId = updatedGameStat.onThirdGpId;
        game.gameStat.awayBatterParticipationId =
          updatedGameStat.awayBatterParticipationId;
        game.gameStat.homeBatterParticipationId =
          updatedGameStat.homeBatterParticipationId;
      }
      // 이닝에 따른 공격/수비 팀 결정
      const isTopInning = game.gameStat.inningHalf === 'TOP';
      const nextBatterGpId = isTopInning
        ? game.gameStat.awayBatterParticipationId // 원정팀 공격
        : game.gameStat.homeBatterParticipationId; // 홈팀 공격
      const nextPitcherGpId = isTopInning
        ? game.gameStat.homePitcherParticipationId // 홈팀 수비
        : game.gameStat.awayPitcherParticipationId; // 원정팀 수비

      // 이닝이 바뀌었는지 확인하고 새로운 GameInningStat 찾기
      let nextInningStat = inningStat;
      if (inningStat.outs === 3) {
        // 이닝이 바뀌었으므로 새로운 GameInningStat을 찾아야 함
        const newInningStat = await em.findOne(GameInningStat, {
          where: {
            gameId: play.gameId,
            inning: game.gameStat.inning,
            inningHalf: game.gameStat.inningHalf,
          },
          order: { id: 'DESC' }, // 가장 최근에 생성된 것
        });

        if (newInningStat) {
          nextInningStat = newInningStat;
          console.log('Debug - Found new inning stat for next play:', {
            inning: newInningStat.inning,
            inningHalf: newInningStat.inningHalf,
          });
        } else {
          console.log('Debug - Warning: New inning stat not found');
        }
      }

      const nextPlay = em.create(Play, {
        game: { id: play.gameId },
        gameId: play.gameId,
        seq: play.seq + 1,
        batterGpId: nextBatterGpId,
        pitcherGpId: nextPitcherGpId,
        gameInningStat: nextInningStat,
        gameInningStatId: nextInningStat.id, // 명시적으로 gameInningStatId 설정
        status: PlayStatus.LIVE,
      });

      await em.save(nextPlay);

      // Game 객체를 직접 전달하여 스냅샷 생성
      const snapshot = await this.gameStatsService.makePlaySnapshotUmpire(
        game,
        nextPlay.id,
      );

      return snapshot;
    });
  }

  // 1. BatterGameStat, BatterStat 업데이트
  private async updateBatterStats(
    queryRunner,
    batterParticipationId,
    body: UpdatePlayDto,
  ): Promise<boolean> {
    // BatterGameParticipation, BatterGameStat, BatterStat 조회
    const batterParticipation = await queryRunner.manager.findOne(
      BatterGameParticipation,
      {
        where: { id: batterParticipationId },
      },
    );
    if (!batterParticipation)
      throw new NotFoundException('BatterGameParticipation not found');
    const batterGameStat = await queryRunner.manager.findOne(BatterGameStat, {
      where: { batterGameParticipationId: batterParticipationId },
    });
    if (!batterGameStat)
      throw new NotFoundException('BatterGameStat not found');

    let isHit = false;
    const resultCode = body.resultCode;
    batterGameStat.plateAppearances++;
    switch (resultCode) {
      case PlateAppearanceResult.SINGLE:
        batterGameStat.atBats++;
        batterGameStat.singles++;
        batterGameStat.hits++;

        isHit = true;
        break;
      case PlateAppearanceResult.DOUBLE:
        batterGameStat.atBats++;
        batterGameStat.doubles++;
        batterGameStat.hits++;
        isHit = true;
        break;
      case PlateAppearanceResult.TRIPLE:
        batterGameStat.atBats++;
        batterGameStat.triples++;
        batterGameStat.hits++;
        isHit = true;
        break;
      case PlateAppearanceResult.HOMERUN:
        batterGameStat.atBats++;
        batterGameStat.homeRuns++;
        batterGameStat.hits++;
        isHit = true;
        break;
      case PlateAppearanceResult.WALK:
        batterGameStat.walks++;
        break;
      case PlateAppearanceResult.SACRIFICE_FLY:
        batterGameStat.sacrificeFlies++;
        break;
      case PlateAppearanceResult.SACRIFICE_BUNT:
        batterGameStat.sacrificeBunts++;
        break;
      case PlateAppearanceResult.STRIKEOUT:
        batterGameStat.strikeouts++;
        break;
      case PlateAppearanceResult.STRIKEOUT_DROP:
        batterGameStat.strikeouts++;
        break;
      case PlateAppearanceResult.FIELDERS_CHOICE:
        batterGameStat.atBats++;
        break;
      case PlateAppearanceResult.ERROR:
        batterGameStat.atBats++;
        break;
      case PlateAppearanceResult.OUT:
        batterGameStat.atBats++;
        break;
    }
    await queryRunner.manager.save(batterGameStat);
    return isHit;
  }

  // 2. PitcherGameStat, PitcherStat 업데이트
  private async updatePitcherStats(
    queryRunner,
    pitcherParticipationId,
    body: UpdatePlayDto,
  ) {
    // PitcherGameParticipation, PitcherGameStat, PitcherStat 조회
    const pitcherParticipation = await queryRunner.manager.findOne(
      PitcherGameParticipation,
      {
        where: { id: pitcherParticipationId },
      },
    );
    if (!pitcherParticipation)
      throw new NotFoundException('PitcherGameParticipation not found');
    const pitcherGameStat = await queryRunner.manager.findOne(PitcherGameStat, {
      where: { pitcherGameParticipationId: pitcherParticipationId },
    });
    if (!pitcherGameStat)
      throw new NotFoundException('PitcherGameStat not found');
    // TODO: body.resultCode에 따라 기록 업데이트 (삼진, 실점 등)
    const resultCode = body.resultCode;
    switch (resultCode) {
      case PlateAppearanceResult.STRIKEOUT:
        pitcherGameStat.strikeouts++;
        break;
      case PlateAppearanceResult.STRIKEOUT_DROP:
        pitcherGameStat.strikeouts++;
        break;
      case PlateAppearanceResult.SINGLE:
      case PlateAppearanceResult.DOUBLE:
      case PlateAppearanceResult.TRIPLE:
      case PlateAppearanceResult.HOMERUN:
        pitcherGameStat.hits++;
        break;
      case PlateAppearanceResult.WALK:
        pitcherGameStat.walks++;
        break;
    }
    await queryRunner.manager.save(pitcherGameStat);
  }

  /**
   * 다음 타자를 찾는 메서드
   * @param em EntityManager
   * @param gameId 게임 ID
   * @param gameStat 게임 상태
   * @returns 다음 타자 BatterGameParticipation 또는 null
   */
  private async findNextBatter(
    em: EntityManager,
    gameId: number,
    gameStat: GameStat,
  ): Promise<BatterGameParticipation | null> {
    // 현재 공격 팀 ID 결정
    const isTopInning = gameStat.inningHalf === 'TOP';
    const currentBatterGpId = isTopInning
      ? gameStat.awayBatterParticipationId
      : gameStat.homeBatterParticipationId;

    // 현재 타자 정보 조회
    const currentBatter = await em.findOne(BatterGameParticipation, {
      where: { id: currentBatterGpId },
      relations: ['team'],
    });

    if (!currentBatter) {
      return null;
    }

    // 현재 공격 팀의 모든 활성 타자 조회 (타순 순으로 정렬)
    const teamBatters = await em.find(BatterGameParticipation, {
      where: {
        gameId: gameId,
        teamId: currentBatter.teamId,
        isActive: true,
      },
      order: { battingOrder: 'ASC' },
    });

    if (teamBatters.length === 0) {
      return null;
    }

    // 현재 타자의 타순 찾기
    const currentOrder = currentBatter.battingOrder;

    // 다음 타자 찾기 (현재 타순 + 1, 만약 마지막이면 1번으로)
    let nextOrder = currentOrder + 1;
    if (nextOrder > teamBatters.length) {
      nextOrder = 1;
    }

    // 다음 타자 반환
    const nextBatter = teamBatters.find((b) => b.battingOrder === nextOrder);
    return nextBatter || null;
  }
}
