import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Entity, EntityManager } from 'typeorm';
import { Play, PlayStatus } from '@/plays/entities/play.entity';
import { GameStat } from '@/games/entities/game-stat.entity';
import { InningHalf } from '@/common/enums/inning-half.enum';
import { AddRunnerEventsDto } from './dtos/create-runner-events.dto';
import { PitcherGameStat } from '@/games/entities/pitcher-game-stat.entity';
import { BatterGameStat } from '@/games/entities/batter-game-stat.entity';
import { PlateAppearanceResult } from '@/common/enums/plate-appearance-result.enum';
import { BatterGameParticipation } from '@/games/entities/batter-game-participation.entity';
import { PitcherGameParticipation } from '@/games/entities/pitcher-game-participation.entity';
import { GameStatsService } from '@/games/services/game-stats.service';
import { GameCoreService } from '@/games/services/game-core.service';
import { RunnerEventInput } from './dtos/create-runner-events.dto';
import { UpdatePlayDto } from './dtos/update-play.dto';
import { RunnerEvent } from './entities/runner-event.entity';
import { GameInningStat } from '@/games/entities/game-inning-stat.entity';
import { Runner } from './entities/runner.entity';

@Injectable()
export class PlayService {
  constructor(
    private readonly em: EntityManager,
    private readonly dataSource: DataSource,
    private readonly gameStatsService: GameStatsService,
    private readonly gameCoreService: GameCoreService,
  ) {}

  async updatePlay(playId: number, body: UpdatePlayDto) {
    return await this.em.transaction(async (em) => {
      // 1. play 업데이트
      const play = await em.findOne(Play, {
        where: { id: playId },
        relations: ['gameInningStat', 'game'],
      });
      if (!play) throw new NotFoundException('Play not found');
      if (play.status === PlayStatus.COMPLETE) {
        return {
          success: false,
          message: '이미 완료된 플레이입니다.',
        };
      }
      play.resultCode = body.resultCode;
      await em.save(play);

      // 2. BatterGameStat 업데이트
      const isHit = await this.updateBatterStats(em, play.batterGpId, body);

      // 3. PitcherGameStat 업데이트
      await this.updatePitcherStats(em, play.pitcherGpId, body);

      // 4. GameStat 업데이트
      const gameStat = await em.findOne(GameStat, {
        where: { gameId: play.gameId },
      });
      if (!gameStat) throw new NotFoundException('GameStat not found');

      const isTopInning = gameStat.inningHalf === InningHalf.TOP;
      if (isHit) {
        isTopInning ? gameStat.awayHits++ : gameStat.homeHits++;
      }
      await em.save(gameStat);

      return {
        success: true,
        message: '타석결과가 업데이트되었습니다.',
      };
    });
  }

  async addRunnerEvents(playId: number, dto: AddRunnerEventsDto) {
    let newPlayId: number | null = null;
    let gameId: number | null = null;

    const result = await this.em.transaction(async (em) => {
      // 1. play 조회
      const play = await em.findOne(Play, {
        where: { id: playId },
        relations: ['gameInningStat', 'game', 'game.gameStat'],
      });
      if (!play) throw new NotFoundException('Play not found');

      // 2. 검증 로직 실행
      this.validateResultCode(play, dto);
      this.validateBatterInAfterPhase(dto);
      this.checkEquivalentStartEndBase(dto.events);

      // 3. 이벤트 정렬 및 처리
      const runnerEvents = await this.sortRunnerEvents(dto, play, em);

      // 모든 이벤트를 처리
      for (const event of runnerEvents) {
        await this.processActualEvent(em, event, play, dto.phase);
      }

      // 모든 이벤트 처리 후 3아웃 체크 및 게임 상태 업데이트
      const newPlay = await this.checkGameStateAfterEvents(em, play, dto.phase);

      // 스냅샷 생성을 위한 정보 저장
      newPlayId = newPlay.id;
      gameId = newPlay.gameId;

      const snapshot = await this.gameStatsService.makePlaySnapshotUmpire(
        newPlay.gameId,
        newPlay.id,
        em,
      );

      return {
        success: true,
        message: '이벤트가 처리되었습니다.',
        snapshot,
      };
    });

    // 트랜잭션 완료 후 관중용 스냅샷 생성
    if (result.success && newPlayId && gameId) {
      await this.pushSnapshotAudience(gameId, newPlayId);
    }

    return result;
  }

  /**
   * 타석 결과 코드 검증
   */
  private validateResultCode(play: Play, dto: AddRunnerEventsDto): void {
    // virtual 기능 제거로 인해 에러 관련 검증 로직 단순화
    // 필요시 다른 방식으로 처리
  }

  /**
   * AFTER phase에서 타자 존재 검증
   */
  private validateBatterInAfterPhase(dto: AddRunnerEventsDto): void {
    if (dto.phase === 'AFTER') {
      const hasBatterRunner = dto.events.some(
        (event) => event.startBase === 'B',
      );

      if (!hasBatterRunner) {
        throw new BadRequestException(
          'AFTER phase에서는 타자(startBase: B)가 반드시 존재해야 합니다.',
        );
      }
    }
  }

  /**
   * 이벤트들의 startBase와 endBase 검증
   */
  private checkEquivalentStartEndBase(events: RunnerEventInput[]): void {
    for (const event of events) {
      if (!event.validateStartEndBase()) {
        throw new BadRequestException(
          `startBase(${event.startBase})와 endBase(${event.endBase})는 같을 수 없습니다.`,
        );
      }
    }
  }

  /**
   * 실제 이벤트들의 사전작업 (검증, 정렬, 생성, 저장)
   */
  private async sortRunnerEvents(
    dto: AddRunnerEventsDto,
    play: Play,
    em: EntityManager,
  ): Promise<RunnerEvent[]> {
    // 이벤트를 startBase 순으로 정렬 (B -> 1 -> 2 -> 3)
    const sortedEvents = this.sortRunnerEventsByStartBase(dto.events);
    const runnerEvents = await this.makeRunnerEvents(sortedEvents, play, em);

    for (const runnerEvent of runnerEvents) {
      await em.save(runnerEvent);
    }

    return runnerEvents;
  }

  // 트랜잭션 외부에서 관중용 스냅샷 생성
  async pushSnapshotAudience(gameId: number, playId: number) {
    await this.gameCoreService.pushSnapshotAudience(gameId, playId);
  }

  private async processActualEvent(
    em: EntityManager,
    event: RunnerEvent,
    play: Play,
    phase?: 'PREV' | 'AFTER',
  ) {
    // 출루 처리
    if (event.startBase === 'B' && event.endBase != 'O') {
      const runner = await em.create(Runner, {
        runnerGpId: event.runnerGpId,
        responsiblePitcherGpId: play.pitcherGpId,
        originPlay: play,
        gameInningStatId: play.gameInningStat.id,
        isActive: true, // 출루 시 활성 상태로 설정
      });
      await em.save(runner);
    }

    // 아웃 처리
    if (event.endBase === 'O') {
      play.gameInningStat.outs++;

      // Runner를 비활성화 (아웃)
      const runner = await em.findOne(Runner, {
        where: {
          runnerGpId: event.runnerGpId,
          gameInningStatId: play.gameInningStat.id,
          isActive: true,
        },
      });
      if (runner) {
        runner.isActive = false;
        await em.save(runner);
      }

      // 투수 기록 업데이트
      const pitcherGp = await em.findOne(PitcherGameParticipation, {
        where: { id: play.pitcherGpId },
        relations: ['pitcherGameStat'],
      });
      if (pitcherGp?.pitcherGameStat) {
        pitcherGp.pitcherGameStat.inningPitchedOuts++;
        await em.save(pitcherGp.pitcherGameStat);
      }
    }
    // 1. 득점 처리
    else if (event.endBase === 'H') {
      play.gameInningStat.runs++;

      // a. GameStat의 점수 업데이트
      const gameStat = await em.findOne(GameStat, {
        where: { gameId: play.gameId },
      });
      if (gameStat) {
        if (play.gameInningStat.inningHalf === InningHalf.TOP) {
          gameStat.awayScore++;
        } else {
          gameStat.homeScore++;
        }
        await em.save(gameStat);
      }

      // b. 타자 기록 업데이트
      const runnerGp = await em.findOne(BatterGameParticipation, {
        where: { id: event.runnerGpId },
        relations: ['batterGameStat'],
      });
      if (runnerGp?.batterGameStat) {
        runnerGp.batterGameStat.runs++;
        await em.save(runnerGp.batterGameStat);
      }

      // c. Runner를 비활성화 (득점)
      const runner = await em.findOne(Runner, {
        where: {
          runnerGpId: event.runnerGpId,
          gameInningStatId: play.gameInningStat.id,
          isActive: true,
        },
      });
      if (runner) {
        runner.isActive = false;
        await em.save(runner);
      }

      // d. 타점 처리
      const batterGp = await em.findOne(BatterGameParticipation, {
        where: { id: play.batterGpId },
        relations: ['batterGameStat'],
      });
      if (batterGp?.batterGameStat) {
        await em.save(batterGp.batterGameStat);
      }
      // e. 투수 기록 업데이트
      const pitcherGp = await em.findOne(PitcherGameParticipation, {
        where: { id: runner.responsiblePitcherGpId },
        relations: ['pitcherGameStat'],
      });
      if (pitcherGp?.pitcherGameStat) {
        pitcherGp.pitcherGameStat.allowedRuns++;
        await em.save(pitcherGp.pitcherGameStat);
      }
    }
    await em.save(play.gameInningStat);
    // 2. 주자판 업데이트
    await this.updateBasesForEvent(em, play, event);
  }

  private async handleInningEnd(
    em: EntityManager,
    play: Play,
    phase?: 'PREV' | 'AFTER',
  ): Promise<Play> {
    const gameStat = await em.findOne(GameStat, {
      where: { gameId: play.gameId },
    });
    if (!gameStat) throw new NotFoundException('GameStat not found');

    play.gameInningStat.endSeq = play.seq;
    await em.save(play.gameInningStat);

    // phase에 따라 현재 타자 처리
    if (phase === 'AFTER') {
      // phase가 'AFTER'인 경우 현재 타자를 다음 타자로 업데이트
      const isTopInning = gameStat.inningHalf === InningHalf.TOP;
      const currentBatterGpId = isTopInning
        ? gameStat.awayBatterParticipationId
        : gameStat.homeBatterParticipationId;

      // 다음 타자 찾기
      const nextBatter = await this.findNextBatter(
        em,
        play.gameId,
        currentBatterGpId,
      );

      if (nextBatter) {
        // gameStat의 batterGpId를 다음 타자로 업데이트
        if (isTopInning) {
          gameStat.awayBatterParticipationId = nextBatter.id;
        } else {
          gameStat.homeBatterParticipationId = nextBatter.id;
        }
      }
      play.status = PlayStatus.COMPLETE;
    } else {
      play.status = PlayStatus.ABANDONED;
    }

    // 3. 새 플레이 생성 (같은 트랜잭션 내에서)

    await em.save(play);

    let newInning = gameStat.inning;
    let newInningHalf: InningHalf;
    if (gameStat.inningHalf === InningHalf.TOP) {
      newInningHalf = InningHalf.BOT;
    } else {
      newInningHalf = InningHalf.TOP;
      newInning += 1;
    }
    const newInningStat = em.create(GameInningStat, {
      gameId: play.gameId,
      inning: newInning,
      inningHalf: newInningHalf,
      outs: 0,
      runs: 0,
      startSeq: play.seq + 1,
    });
    gameStat.inning = newInning;
    gameStat.inningHalf = newInningHalf;

    // 주자판 초기화
    gameStat.onFirstGpId = null;
    gameStat.onSecondGpId = null;
    gameStat.onThirdGpId = null;
    await em.save(gameStat);
    await em.save(newInningStat);

    // 새로운 Play 생성
    const { max } = await em
      .createQueryBuilder(Play, 'p')
      .where('p.gameId = :gameId', { gameId: play.gameId })
      .select('COALESCE(MAX(p.seq), 0)', 'max')
      .getRawOne();
    const seq = Number(max) + 1;

    const isTop = gameStat.inningHalf === InningHalf.TOP;
    const newPlay = em.create(Play, {
      gameId: play.gameId,
      seq,
      batterGpId: isTop
        ? gameStat.awayBatterParticipationId
        : gameStat.homeBatterParticipationId,
      pitcherGpId: isTop
        ? gameStat.homePitcherParticipationId
        : gameStat.awayPitcherParticipationId,
      status: PlayStatus.LIVE,
      gameInningStat: newInningStat,
    });
    await em.save(newPlay);
    return newPlay;
  }

  private async handleNextBatter(em: EntityManager, play: Play): Promise<Play> {
    // 다음 타자 업데이트
    const gameStat = await em.findOne(GameStat, {
      where: { gameId: play.gameId },
    });
    if (gameStat) {
      // 다음 타자 로직 구현
      const isTopInning = gameStat.inningHalf === 'TOP';
      const currentBatterGpId = isTopInning
        ? gameStat.awayBatterParticipationId
        : gameStat.homeBatterParticipationId;

      // 다음 타자 찾기
      const nextBatter = await this.findNextBatter(
        em,
        play.gameId,
        currentBatterGpId,
      );

      if (nextBatter) {
        // gameStat의 batterGpId를 다음 타자로 업데이트
        if (isTopInning) {
          gameStat.awayBatterParticipationId = nextBatter.id;
        } else {
          gameStat.homeBatterParticipationId = nextBatter.id;
        }

        // 주자슬롯 업데이트

        await em.save(gameStat);
      }
    }

    // 새 플레이 생성 (같은 트랜잭션 내에서)
    play.status = PlayStatus.COMPLETE;
    await em.save(play);

    // 새로운 Play 생성
    const { max } = await em
      .createQueryBuilder(Play, 'p')
      .where('p.gameId = :gameId', { gameId: play.gameId })
      .select('COALESCE(MAX(p.seq), 0)', 'max')
      .getRawOne();
    const seq = Number(max) + 1;

    const isTop = gameStat.inningHalf === InningHalf.TOP;
    const newPlay = em.create(Play, {
      gameId: play.gameId,
      seq,
      batterGpId: isTop
        ? gameStat.awayBatterParticipationId
        : gameStat.homeBatterParticipationId,
      pitcherGpId: isTop
        ? gameStat.homePitcherParticipationId
        : gameStat.awayPitcherParticipationId,
      status: PlayStatus.LIVE,
      gameInningStat: play.gameInningStat,
    });
    await em.save(newPlay);
    return newPlay;
  }

  private async checkGameStateAfterEvents(
    em: EntityManager,
    play: Play,
    phase?: 'PREV' | 'AFTER',
  ) {
    // 3아웃 체크 및 게임 상태 업데이트
    if (play.gameInningStat.outs >= 3) {
      // 이닝 종료 처리
      return await this.handleInningEnd(em, play, phase);
    } else {
      // 다음 타자 업데이트 및 새 플레이 생성
      if (phase === 'AFTER') {
        return await this.handleNextBatter(em, play);
      } else {
        return play;
      }
    }
  }

  private async updateBasesForEvent(
    em: EntityManager,
    play: Play,
    event: RunnerEvent,
  ) {
    const gameStat = await em.findOne(GameStat, {
      where: { gameId: play.gameId },
    });
    if (!gameStat) throw new NotFoundException('GameStat not found');

    await this.updateBasesForEventCommon(gameStat, event);
    await em.save(gameStat);
  }

  private async updateBasesForEventCommon(
    baseHolder: GameStat,
    event: RunnerEvent,
  ) {
    const { startBase, endBase, runnerGpId } = event;

    // 타자가 베이스로 진루
    if (startBase === 'B' && ['1', '2', '3'].includes(endBase)) {
      if (endBase === '1') baseHolder.onFirstGpId = runnerGpId;
      else if (endBase === '2') baseHolder.onSecondGpId = runnerGpId;
      else if (endBase === '3') baseHolder.onThirdGpId = runnerGpId;
    }
    // 주자가 베이스 간 이동 (도루, 진루 등)
    else if (
      ['1', '2', '3'].includes(startBase) &&
      ['1', '2', '3'].includes(endBase)
    ) {
      // 시작 베이스에서 제거
      if (startBase === '1') baseHolder.onFirstGpId = null;
      else if (startBase === '2') baseHolder.onSecondGpId = null;
      else if (startBase === '3') baseHolder.onThirdGpId = null;

      // 도착 베이스에 배치
      if (endBase === '1') baseHolder.onFirstGpId = runnerGpId;
      else if (endBase === '2') baseHolder.onSecondGpId = runnerGpId;
      else if (endBase === '3') baseHolder.onThirdGpId = runnerGpId;
    }
    // 주자가 홈으로 들어오거나 아웃
    else if (
      ['1', '2', '3'].includes(startBase) &&
      (endBase === 'H' || endBase === 'O')
    ) {
      // 시작 베이스에서 제거
      if (startBase === '1') baseHolder.onFirstGpId = null;
      else if (startBase === '2') baseHolder.onSecondGpId = null;
      else if (startBase === '3') baseHolder.onThirdGpId = null;
    }
  }

  private async makeRunnerEvents(
    events: RunnerEventInput[],
    play: Play,
    em: EntityManager,
  ): Promise<RunnerEvent[]> {
    return events.map((event) => {
      const runnerEvent = em.create(RunnerEvent, {
        gameId: play.gameId,
        playId: play.id,
        runnerGpId: event.runnerId,
        startBase: event.startBase,
        endBase: event.endBase,
        isActual: event.isActual,
      });
      return runnerEvent;
    });
  }

  private sortRunnerEventsByStartBase(
    events: RunnerEventInput[],
  ): RunnerEventInput[] {
    const baseOrder = { B: 0, '1': 1, '2': 2, '3': 3 };

    return events.sort((a, b) => {
      const orderA = baseOrder[a.startBase as keyof typeof baseOrder];
      const orderB = baseOrder[b.startBase as keyof typeof baseOrder];
      return orderB - orderA; // 역순 정렬 (3 -> 2 -> 1 -> B)
    });
  }

  // 1. BatterGameStat, BatterStat 업데이트
  private async updateBatterStats(
    em: EntityManager,
    batterParticipationId,
    body: UpdatePlayDto,
  ): Promise<boolean> {
    // BatterGameParticipation, BatterGameStat 조회
    const batterParticipation = await em.findOne(BatterGameParticipation, {
      where: { id: batterParticipationId },
    });
    if (!batterParticipation)
      throw new NotFoundException('BatterGameParticipation not found');
    const batterGameStat = await em.findOne(BatterGameStat, {
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
        batterGameStat.atBats++;
        batterGameStat.strikeouts++;
        break;
      case PlateAppearanceResult.STRIKEOUT_DROP:
        batterGameStat.atBats++;
        batterGameStat.strikeouts++;
        break;
      case PlateAppearanceResult.FIELDERS_CHOICE:
      case PlateAppearanceResult.OUT:
      case PlateAppearanceResult.ERROR:
        batterGameStat.atBats++;
        break;
    }
    await em.save(batterGameStat);
    return isHit;
  }

  // 2. PitcherGameStat, PitcherStat 업데이트
  private async updatePitcherStats(
    em: EntityManager,
    pitcherParticipationId,
    body: UpdatePlayDto,
  ) {
    // PitcherGameParticipation, PitcherGameStat 조회
    const pitcherParticipation = await em.findOne(PitcherGameParticipation, {
      where: { id: pitcherParticipationId },
    });
    if (!pitcherParticipation)
      throw new NotFoundException('PitcherGameParticipation not found');
    const pitcherGameStat = await em.findOne(PitcherGameStat, {
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
        pitcherGameStat.allowedHits++;
        break;
      case PlateAppearanceResult.WALK:
        pitcherGameStat.walks++;
        break;
    }
    await em.save(pitcherGameStat);
  }

  private async findNextBatter(
    em: EntityManager,
    gameId: number,
    currentBatterGpId: number,
  ): Promise<BatterGameParticipation | null> {
    // 현재 타자 정보 조회
    const currentBatter = await em.findOne(BatterGameParticipation, {
      where: { id: currentBatterGpId },
      relations: ['teamTournament'],
    });

    if (!currentBatter) {
      throw new NotFoundException('Current batter not found');
    }

    // 현재 공격 팀의 모든 활성 타자 조회 (타순 순으로 정렬)
    const teamBatters = await em.find(BatterGameParticipation, {
      where: {
        gameId: gameId,
        teamTournamentId: currentBatter.teamTournamentId,
        isActive: true,
      },
      order: { battingOrder: 'ASC' },
    });

    if (teamBatters.length === 0) {
      throw new NotFoundException('No next batter found');
    }

    // 현재 타자의 타순 찾기
    const currentOrder = currentBatter.battingOrder;

    // 다음 타자 찾기 (현재 타순 + 1, 만약 마지막이면 1번으로)
    let nextOrder = currentOrder + 1;
    if (nextOrder > teamBatters.length) {
      nextOrder = 1;
    }

    // 다음 타자 찾기
    const nextBatter = teamBatters.find((b) => b.battingOrder === nextOrder);

    return nextBatter || null;
  }
}
