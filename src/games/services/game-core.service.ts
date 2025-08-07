import { Repository, DataSource, EntityManager, Not, IsNull } from 'typeorm';
import { Game } from '../entities/game.entity';
import { GameStatus } from '@common/enums/game-status.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { GameDto, GamesByDatesResponseDto } from '../dtos/game.dto';
import { InningHalf } from '@common/enums/inning-half.enum';
import { BatterGameParticipation } from '../entities/batter-game-participation.entity';
import { PitcherGameParticipation } from '../entities/pitcher-game-participation.entity';
import { GameStat } from '../entities/game-stat.entity';
import { TeamTournament } from '@/teams/entities/team-tournament.entity';
import { GameStatsService } from './game-stats.service';
import { Umpire } from '@/umpires/entities/umpire.entity';
import { SimpleScoreRequestDto } from '../dtos/score.dto';
import { GameInningStat } from '../entities/game-inning-stat.entity';
import { BaseException } from '@/common/exceptions/base.exception';
import { ErrorCodes } from '@/common/exceptions/error-codes.enum';
import { Tournament } from '@/tournaments/entities/tournament.entity';
import { PhaseType } from '@/common/enums/phase-type.enum';
import {
  TournamentGameDto,
  TournamentScheduleResponseDto,
} from '../dtos/tournament-schedule.dto';
import { BracketPosition, MatchStage } from '@/common/enums/match-stage.enum';
import { Observable, ReplaySubject } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { Play, PlayStatus } from '@/plays/entities/play.entity';
/*
  기본 조회, 상태 변경 등 핵심 로직
 */
@Injectable()
export class GameCoreService {
  private readonly logger = new Logger(GameCoreService.name);
  private snapshotStreams = new Map<number, ReplaySubject<MessageEvent>>();

  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    private readonly dataSource: DataSource,
    private readonly gameStatsService: GameStatsService,
    @InjectRepository(Umpire)
    private readonly umpireRepository: Repository<Umpire>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
  ) {}

  async getSchedules(
    from: string,
    to?: string,
    userId?: string,
  ): Promise<GamesByDatesResponseDto> {
    const start = new Date(`${from}T00:00:00+09:00`);
    const end = to
      ? new Date(`${to}T23:59:59+09:00`)
      : new Date(start.getTime() + 7 * 86_400_000);

    const games = await this.gameRepository
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.homeTeam', 'homeTeam')
      .leftJoinAndSelect('homeTeam.team', 'homeTeamTeam')
      .leftJoinAndSelect('g.awayTeam', 'awayTeam')
      .leftJoinAndSelect('awayTeam.team', 'awayTeamTeam')
      .leftJoinAndSelect('g.gameStat', 'stat')
      .where('g.start_time BETWEEN :s AND :e', { s: start, e: end })
      .orderBy('g.start_time', 'ASC')
      .getMany();

    // --- 날짜별 그룹핑 ---
    const byDate = new Map<string, GameDto[]>();
    for (const g of games) {
      const kstDateKey = g.startTime.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Seoul',
      }); // e.g. '2025-05-04'
      const list = byDate.get(kstDateKey) ?? [];
      list.push(await this.mapGameToDto(g, userId));
      byDate.set(kstDateKey, list);
    }

    // --- DTO 변환 ---
    const days = Array.from(byDate.entries()).map(([date, games]) => ({
      date,
      dayOfWeek: this.getDayOfWeek(new Date(`${date}T00:00:00+09:00`)),
      games,
    }));

    return {
      range: {
        from: start.toLocaleDateString('en-CA', {
          timeZone: 'Asia/Seoul',
        }),
        to: end.toLocaleDateString('en-CA', {
          timeZone: 'Asia/Seoul',
        }),
      },
      days,
    };
  }

  private getDayOfWeek(date: Date): string {
    const dayOfWeekMap = ['일', '월', '화', '수', '목', '금', '토'];
    return dayOfWeekMap[date.getDay()];
  }

  private async mapGameToDto(game: Game, userId?: string): Promise<GameDto> {
    // 시간도 KST 기준으로 포맷
    const kstTime = game.startTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul',
    }); // e.g. '14:30'

    // 유저 권한 확인
    const canRecord = await this.checkUserCanRecord(game.id, userId);
    const canSubmitLineup = await this.checkUserCanSubmitLineup(
      game.id,
      userId,
    );

    return {
      id: game.id,
      time: kstTime,
      status: game.status as GameStatus,
      stage: game.stage as MatchStage,
      winnerTeamId: game.winnerTeam?.team.id ?? null,
      inning: game.gameStat?.inning ?? null,
      inningHalf: game.gameStat?.inningHalf ?? null,
      homeTeam: {
        id: game.homeTeam?.team.id ?? null,
        name: game.homeTeam?.team.name ?? null,
        score: game.gameStat?.homeScore ?? null,
      },
      awayTeam: {
        id: game.awayTeam?.team.id ?? null,
        name: game.awayTeam?.team.name ?? null,
        score: game.gameStat?.awayScore ?? null,
      },
      isForfeit: game.isForfeit,
      canRecord: true, // TODO: 심판 권한 확인 후 수정
      canSubmitLineup,
    };
  }

  async getTournamentSchedule(): Promise<TournamentScheduleResponseDto> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: 1 },
    });
    if (!tournament) {
      throw new BaseException(
        '토너먼트를 찾을 수 없습니다.',
        ErrorCodes.TOURNAMENT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const games = await this.gameRepository.find({
      where: { tournamentId: 1, bracketPosition: Not(IsNull()) },
      relations: [
        'homeTeam',
        'awayTeam',
        'homeTeam.team',
        'awayTeam.team',
        'gameStat',
      ],
    });
    const tournamentGames: TournamentGameDto[] = games.map((game) =>
      this.mapGameToTournamentGameDto(game),
    );

    return {
      games: tournamentGames,
    };
  }

  private mapGameToTournamentGameDto(game: Game): TournamentGameDto {
    return {
      gameId: game.id,
      bracketPosition: game.bracketPosition,
      winnerTeamId: game.winnerTeam?.team.id ?? null,
      homeTeam: {
        id: game.homeTeam?.team.id ?? null,
        name: game.homeTeam?.team.name ?? null,
        score: game.gameStat?.homeScore ?? null,
      },
      awayTeam: {
        id: game.awayTeam?.team.id ?? null,
        name: game.awayTeam?.team.name ?? null,
        score: game.gameStat?.awayScore ?? null,
      },
    };
  }

  async startGame(gameId: number): Promise<{
    success: boolean;
    message: string;
    snapshot: any;
  }> {
    return this.dataSource.transaction(async (m) => {
      const game = await this.findGameWithTeams(gameId, m);

      // 1) 선발 batter/pitcher 조회 & 검증
      const [homeBat, awayBat] = await Promise.all([
        this.getStartingBatter(gameId, game.homeTeam.id, m),
        this.getStartingBatter(gameId, game.awayTeam.id, m),
      ]);
      const [homePit, awayPit] = await Promise.all([
        this.getStartingPitcher(gameId, game.homeTeam.id, m),
        this.getStartingPitcher(gameId, game.awayTeam.id, m),
      ]);

      if (!homeBat || !awayBat || !homePit || !awayPit) {
        throw new BaseException(
          '라인업 제출이 완료되지 않았습니다.',
          ErrorCodes.LINEUP_NOT_SUBMITTED,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 2) GameStat (자식) 먼저 INSERT  ─ FK는 game_id 하나뿐이라 순환 無
      const gameStat = await m.save(
        m.create(GameStat, {
          gameId,
          inning: 1,
          inningHalf: InningHalf.TOP,
          homeBatterParticipation: homeBat,
          awayBatterParticipation: awayBat,
          homePitcherParticipation: homePit,
          awayPitcherParticipation: awayPit,
        }),
      );

      const inningStat = await m.save(
        m.create(GameInningStat, {
          gameId,
          inning: 1,
          inningHalf: InningHalf.TOP,
          startSeq: 1,
        }),
      );

      // 2.5) 첫번째 Play(seq=1) 생성
      const firstPlay = await m.save(
        m.create(Play, {
          gameId,
          seq: 1,
          batterGpId: awayBat.id, // 원정팀 1번 타자
          pitcherGpId: homePit.id, // 홈팀 선발 투수
          gameInningStat: inningStat,
          status: PlayStatus.LIVE,
        }),
      );

      // 3) 부모(Game) 상태만 UPDATE (stat FK 건드릴 필요 없음)
      await m.update(Game, gameId, { status: GameStatus.IN_PROGRESS });

      // Game 객체를 직접 전달하여 스냅샷 생성
      const snapshot = await this.gameStatsService.makePlaySnapshotUmpire(
        gameId,
        firstPlay.id,
        m,
      );

      return {
        success: true,
        message: '게임이 시작되었습니다.',
        snapshot,
      };
    });
  }

  private async findGameWithTeams(
    gameId: number,
    manager: EntityManager,
  ): Promise<Game> {
    const game = await manager.findOne(Game, {
      where: { id: gameId },
      relations: ['homeTeam', 'awayTeam', 'homeTeam.team', 'awayTeam.team'],
    });
    if (!game) {
      throw new BaseException(
        `게임 ID ${gameId}를 찾을 수 없습니다.`,
        ErrorCodes.GAME_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return game;
  }

  private async getStartingBatter(
    gameId: number,
    teamTournamentId: number,
    manager: EntityManager,
  ): Promise<BatterGameParticipation | null> {
    return manager.findOne(BatterGameParticipation, {
      where: {
        game: { id: gameId },
        teamTournament: { id: teamTournamentId },
        battingOrder: 1,
        substitutionOrder: 0,
      },
    });
  }

  private async getStartingPitcher(
    gameId: number,
    teamTournamentId: number,
    manager: EntityManager,
  ): Promise<PitcherGameParticipation | null> {
    return manager.findOne(PitcherGameParticipation, {
      where: {
        game: { id: gameId },
        teamTournament: { id: teamTournamentId },
        substitutionOrder: 0,
      },
    });
  }

  /**
   * 게임을 최종 완료 상태로 변경하고 관련된 토너먼트 통계를 업데이트합니다.
   * @param gameId 최종 완료할 게임 ID
   */
  async finalizeGame(
    gameId: number,
  ): Promise<{ success: boolean; message: string }> {
    await this.dataSource.transaction(async (manager) => {
      // 1. 게임 정보 로드 (필요한 관계 모두 포함)
      const game = await manager.findOne(Game, {
        where: { id: gameId },
        relations: ['tournament', 'homeTeam', 'awayTeam', 'gameStat'],
      });

      if (!game) {
        throw new BaseException(
          `게임 ID ${gameId}를 찾을 수 없습니다.`,
          ErrorCodes.GAME_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      // 2. 게임 상태 검증
      if (game.status !== GameStatus.IN_PROGRESS) {
        throw new BaseException(
          `게임이 진행 중이지 않습니다. 현재 상태: ${game.status}`,
          ErrorCodes.GAME_NOT_IN_PROGRESS,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 3. 게임 스탯 확인
      if (!game.gameStat) {
        throw new BaseException(
          `게임 ${gameId}에 통계 정보가 없습니다.`,
          ErrorCodes.GAME_STAT_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      if (!game.tournament || !game.tournament.id) {
        throw new BaseException(
          `게임 ${gameId}에 토너먼트 정보가 없습니다.`,
          ErrorCodes.TOURNAMENT_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      // 4. 팀 토너먼트 통계 업데이트
      if (game.stage === MatchStage.LEAGUE) {
        await this.updateTeamTournamentStats(game, manager);
      } else {
        await this.updateBracketStats(game, manager);
      }

      // 5. 개별 선수 통계 업데이트
      await this.gameStatsService.updatePlayerStats(gameId);

      // 6. 게임 상태 업데이트
      await manager.update(Game, gameId, { status: GameStatus.FINALIZED });
    });
    return { success: true, message: '게임 확정 완료.' };
  }

  /**
   * 게임 결과에 따라 팀 토너먼트 통계를 업데이트합니다.
   * @param game 완료된 게임 정보
   * @param manager EntityManager 인스턴스
   */
  private async updateTeamTournamentStats(
    game: Game,
    manager: EntityManager,
  ): Promise<void> {
    this.logger.log(`Updating team tournament stats for game ID: ${game.id}`);

    // 1. 홈팀과 원정팀의 TeamTournament 레코드 조회
    const [homeTeamTournament, awayTeamTournament] = await Promise.all([
      manager.findOne(TeamTournament, {
        where: {
          team: { id: game.homeTeam.team.id },
          tournament: { id: game.tournamentId },
        },
      }),
      manager.findOne(TeamTournament, {
        where: {
          team: { id: game.awayTeam.team.id },
          tournament: { id: game.tournamentId },
        },
      }),
    ]);

    if (!homeTeamTournament || !awayTeamTournament) {
      throw new BaseException(
        `토너먼트 ID ${game.tournament.id}에 대한 팀 참가 정보를 찾을 수 없습니다.`,
        ErrorCodes.TEAM_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // 2. 득실점 업데이트
    homeTeamTournament.runsScored += game.gameStat.homeScore;
    homeTeamTournament.runsAllowed += game.gameStat.awayScore;
    awayTeamTournament.runsScored += game.gameStat.awayScore;
    awayTeamTournament.runsAllowed += game.gameStat.homeScore;

    // 3. 경기 수 증가
    homeTeamTournament.games += 1;
    awayTeamTournament.games += 1;

    // 4. 승/무/패 업데이트
    let winnerTeamId = null;
    if (game.gameStat.homeScore > game.gameStat.awayScore) {
      // 홈팀 승리
      homeTeamTournament.wins += 1;
      awayTeamTournament.losses += 1;
      winnerTeamId = game.homeTeam.team.id;
      this.logger.debug(
        `Home team win: ${game.homeTeam.team.name} (${game.gameStat.homeScore}) vs ${game.awayTeam.team.name} (${game.gameStat.awayScore})`,
      );
    } else if (game.gameStat.homeScore < game.gameStat.awayScore) {
      // 원정팀 승리
      homeTeamTournament.losses += 1;
      awayTeamTournament.wins += 1;
      winnerTeamId = game.awayTeam.team.id;
      this.logger.debug(
        `Away team win: ${game.homeTeam.team.name} (${game.gameStat.homeScore}) vs ${game.awayTeam.team.name} (${game.gameStat.awayScore})`,
      );
    } else {
      // 무승부
      homeTeamTournament.draws += 1;
      awayTeamTournament.draws += 1;
      this.logger.debug(
        `Draw: ${game.homeTeam.team.name} (${game.gameStat.homeScore}) vs ${game.awayTeam.team.name} (${game.gameStat.awayScore})`,
      );
    }

    await manager.update(Game, game.id, {
      winnerTeam: { team: { id: winnerTeamId } },
    });

    // 5. 팀 토너먼트 통계 저장
    await Promise.all([
      manager.save(TeamTournament, homeTeamTournament),
      manager.save(TeamTournament, awayTeamTournament),
    ]);

    this.logger.log(
      `Successfully updated team tournament stats for game ID: ${game.id}`,
    );
  }
  /**
   * game.homeTeamId, game.awayTeamId 에 대해
   * 1) 둘 다 비어 있으면 50% 확률로
   * 2) 한쪽만 비어 있으면 그 반대편 슬롯에
   * 3) 둘 다 차 있으면 아무 동작 없이
   * teamId 를 할당합니다.
   */

  private async updateBracketStats(game: Game, manager: EntityManager) {
    // 1) 승/패/무 결정
    const { homeScore, awayScore } = game.gameStat;
    const winnerTeamId =
      homeScore > awayScore
        ? game.homeTeam.team.id
        : homeScore < awayScore
          ? game.awayTeam.team.id
          : null;

    const loserTeamId =
      homeScore !== awayScore
        ? homeScore > awayScore
          ? game.awayTeam.team.id
          : game.homeTeam.team.id
        : null;

    // 2) 현재 게임에 승자 업데이트
    await manager.update(Game, game.id, {
      winnerTeamTournamentId: winnerTeamId,
    });

    // 3) 다음 경기 매핑 (QF→SF, SF→F)
    type Slot = 'homeTeamTournamentId' | 'awayTeamTournamentId';
    const transitionMap: Partial<
      Record<BracketPosition, { nextPos: BracketPosition; nextSlot: Slot }>
    > = {
      [BracketPosition.QF_1]: {
        nextPos: BracketPosition.SF_1,
        nextSlot: 'awayTeamTournamentId',
      },
      [BracketPosition.QF_2]: {
        nextPos: BracketPosition.SF_1,
        nextSlot: 'homeTeamTournamentId',
      },
      [BracketPosition.QF_3]: {
        nextPos: BracketPosition.SF_2,
        nextSlot: 'awayTeamTournamentId',
      },
      [BracketPosition.QF_4]: {
        nextPos: BracketPosition.SF_2,
        nextSlot: 'homeTeamTournamentId',
      },
      [BracketPosition.SF_1]: {
        nextPos: BracketPosition.F,
        nextSlot: 'awayTeamTournamentId',
      },
      [BracketPosition.SF_2]: {
        nextPos: BracketPosition.F,
        nextSlot: 'homeTeamTournamentId',
      },
    };

    const transition = transitionMap[game.bracketPosition];
    if (transition && winnerTeamId !== null) {
      // 4) 다음 경기(준결승→결승 혹은 8강→준결승) 승자 배치
      const nextGame = await manager.findOneOrFail(Game, {
        where: {
          tournamentId: game.tournamentId,
          bracketPosition: transition.nextPos,
        },
      });
      nextGame[transition.nextSlot] = winnerTeamId;
      await manager.save(nextGame);

      // 5) "준결승 → 결승" 이동일 때만 패자를 3·4위전에 고정 배치
      if (
        (game.bracketPosition === BracketPosition.SF_1 ||
          game.bracketPosition === BracketPosition.SF_2) &&
        loserTeamId !== null
      ) {
        const thirdGame = await manager.findOneOrFail(Game, {
          where: {
            tournamentId: game.tournamentId,
            bracketPosition: BracketPosition.THIRD_PLACE,
          },
        });

        if (game.bracketPosition === BracketPosition.SF_1) {
          // SF1 패자는 awayTeam
          thirdGame.awayTeamTournamentId = loserTeamId;
        } else {
          // SF2 패자는 homeTeam
          thirdGame.homeTeamTournamentId = loserTeamId;
        }

        await manager.save(thirdGame);
      }
    }
  }

  async assignUmpireToGame(gameId: number, umpireId: number) {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
    });

    if (!game) {
      throw new BaseException(
        '게임을 찾을 수 없습니다.',
        ErrorCodes.GAME_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const umpire = await this.umpireRepository.findOne({
      where: { id: umpireId },
      relations: ['user'],
    });

    if (!umpire) {
      throw new BaseException(
        '심판을 찾을 수 없습니다.',
        ErrorCodes.UMPIRE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    game.recordUmpire = umpire;
    return this.gameRepository.save(game);
  }

  async changeUmpire(gameId: number, umpireId: number) {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
    });

    if (!game) {
      throw new BaseException(
        '게임을 찾을 수 없습니다.',
        ErrorCodes.GAME_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const umpire = await this.umpireRepository.findOne({
      where: { id: umpireId },
      relations: ['user'],
    });

    if (!umpire) {
      throw new BaseException(
        '심판을 찾을 수 없습니다.',
        ErrorCodes.UMPIRE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    game.recordUmpire = umpire;

    return this.gameRepository.save(game);
  }

  async updateSchedule(gameId: number, startTime: Date) {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
    });

    if (!game) {
      throw new BaseException(
        '게임을 찾을 수 없습니다.',
        ErrorCodes.GAME_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    game.startTime = startTime;
    return this.gameRepository.save(game);
  }

  async forfeitGame(gameId: number, winnerTeamId: number) {
    await this.dataSource.transaction(async (manager) => {
      const game = await manager.findOne(Game, {
        where: { id: gameId },
        relations: ['homeTeam', 'awayTeam', 'homeTeam.team', 'awayTeam.team'],
      });

      if (!game) {
        throw new BaseException(
          '게임을 찾을 수 없습니다.',
          ErrorCodes.GAME_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      if (
        winnerTeamId !== game.homeTeam.team.id &&
        winnerTeamId !== game.awayTeam.team.id
      ) {
        throw new BaseException(
          '유효하지 않은 승자 팀 ID입니다.',
          ErrorCodes.INVALID_INPUT,
          HttpStatus.BAD_REQUEST,
        );
      }
      game.status = GameStatus.FINALIZED;
      game.winnerTeamTournamentId = winnerTeamId;
      game.isForfeit = true;

      const [homeTeamTournament, awayTeamTournament] = await Promise.all([
        manager.findOne(TeamTournament, {
          where: {
            team: { id: game.homeTeam.team.id },
            tournament: { id: game.tournamentId },
          },
        }),
        manager.findOne(TeamTournament, {
          where: {
            team: { id: game.awayTeam.team.id },
            tournament: { id: game.tournamentId },
          },
        }),
      ]);

      if (!homeTeamTournament || !awayTeamTournament) {
        throw new BaseException(
          `토너먼트 참가 정보를 찾을 수 없습니다.`,
          ErrorCodes.TEAM_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      // 5. 승/패 업데이트
      homeTeamTournament.games += 1;
      awayTeamTournament.games += 1;

      if (winnerTeamId === game.homeTeam.team.id) {
        homeTeamTournament.wins += 1;
        awayTeamTournament.losses += 1;
      } else {
        homeTeamTournament.losses += 1;
        awayTeamTournament.wins += 1;
      }

      // 6. 변경사항 저장
      await Promise.all([
        manager.save(Game, game),
        manager.save(TeamTournament, homeTeamTournament),
        manager.save(TeamTournament, awayTeamTournament),
      ]);

      return {
        success: true,
        message: `게임 ${gameId}이(가) 몰수승으로 처리되었습니다. 승리팀: ${winnerTeamId}`,
      };
    });
  }

  async changePhase(tournamentId: number) {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new BaseException(
        '토너먼트를 찾을 수 없습니다.',
        ErrorCodes.TOURNAMENT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.tournamentRepository.save(tournament);
  }

  // 관중용 스냅샷을 push하는 메서드
  async pushSnapshotAudience(gameId: number, playId: number) {
    const snapshot = await this.gameStatsService.makePlaySnapshotAudience(
      gameId,
      playId,
    );
    if (!this.snapshotStreams.has(gameId)) {
      this.snapshotStreams.set(gameId, new ReplaySubject<MessageEvent>(1));
    }
    this.snapshotStreams.get(gameId).next({ data: snapshot });
  }

  getSnapshotStream(gameId: number): Observable<MessageEvent> {
    if (!this.snapshotStreams.has(gameId)) {
      this.snapshotStreams.set(gameId, new ReplaySubject<MessageEvent>(1));
    }
    // 구독 시 최신 playId로 관중용 스냅샷 push
    this.pushLatestAudienceSnapshot(gameId);
    return this.snapshotStreams.get(gameId).asObservable();
  }

  // 최신 playId로 관중용 스냅샷 push
  private async pushLatestAudienceSnapshot(gameId: number) {
    // Play 엔티티에서 해당 gameId의 가장 최신 playId를 조회
    const latestPlay = await this.dataSource.getRepository('Play').findOne({
      where: { gameId },
      order: { seq: 'DESC' },
    });
    if (latestPlay) {
      await this.pushSnapshotAudience(gameId, latestPlay.id);
    }
  }

  private async checkUserCanRecord(
    gameId: number,
    userId?: string,
  ): Promise<boolean> {
    if (!userId) return false;

    try {
      // 해당 경기의 심판인지 확인
      const umpire = await this.umpireRepository.findOne({
        where: { userId: parseInt(userId) },
        relations: ['umpireTournaments'],
      });

      if (!umpire) return false;

      // 해당 경기가 속한 대회의 심판인지 확인
      const game = await this.gameRepository.findOne({
        where: { id: gameId },
        relations: ['tournament'],
      });

      if (!game) return false;

      const isUmpireForGame = umpire.umpireTournaments.some(
        (ut) => ut.tournamentId === game.tournamentId,
      );

      return isUmpireForGame;
    } catch (error) {
      this.logger.error(`Error checking user can record: ${error.message}`);
      return false;
    }
  }

  private async checkUserCanSubmitLineup(
    gameId: number,
    userId?: string,
  ): Promise<{ home: boolean; away: boolean }> {
    if (!userId) return { home: false, away: false };

    try {
      // 해당 경기의 팀 대표자인지 확인
      const game = await this.gameRepository.findOne({
        where: { id: gameId },
        relations: ['homeTeam', 'awayTeam', 'homeTeam.team', 'awayTeam.team'],
      });

      if (!game) return { home: false, away: false };

      // 홈팀과 원정팀의 대표자 확인
      const homeTeamTournament = await this.dataSource
        .getRepository('TeamTournament')
        .findOne({
          where: {
            teamId: game.homeTeam.team.id,
            tournamentId: game.tournamentId,
          },
        });

      const awayTeamTournament = await this.dataSource
        .getRepository('TeamTournament')
        .findOne({
          where: {
            teamId: game.awayTeam.team.id,
            tournamentId: game.tournamentId,
          },
        });

      const isHomeTeamRep = homeTeamTournament?.representativeUserId === userId;
      const isAwayTeamRep = awayTeamTournament?.representativeUserId === userId;

      return {
        home: isHomeTeamRep,
        away: isAwayTeamRep,
      };
    } catch (error) {
      this.logger.error(
        `Error checking user can submit lineup: ${error.message}`,
      );
      return { home: false, away: false };
    }
  }
}
