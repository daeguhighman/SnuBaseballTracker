import { Repository, DataSource, EntityManager } from 'typeorm';
import { Game } from '../entities/game.entity';
import { GameStatus } from '@common/enums/game-status.enum';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  ConflictException,
  HttpStatus,
} from '@nestjs/common';
import { Between } from 'typeorm';
import {
  GameDto,
  GamesByDatesResponseDto,
  GameScheduleResponseDto,
} from '../dtos/game.dto';
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
/*
  기본 조회, 상태 변경 등 핵심 로직
 */
@Injectable()
export class GameCoreService {
  private readonly logger = new Logger(GameCoreService.name);

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
  ): Promise<GamesByDatesResponseDto> {
    const start = new Date(`${from}T00:00:00+09:00`);
    const end = to
      ? new Date(`${to}T23:59:59+09:00`)
      : new Date(start.getTime() + 7 * 86_400_000);

    const games = await this.gameRepository
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.homeTeam', 'homeTeam')
      .leftJoinAndSelect('g.awayTeam', 'awayTeam')
      .leftJoinAndSelect('g.gameStat', 'stat')
      .where('g.start_time BETWEEN :s AND :e', { s: start, e: end })
      .orderBy('g.start_time', 'ASC')
      .getMany();

    // --- 날짜별 그룹핑 ---
    const byDate = new Map<string, GameDto[]>();
    games.forEach((g) => {
      const kstDateKey = g.startTime.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Seoul',
      }); // e.g. '2025-05-04'
      const list = byDate.get(kstDateKey) ?? [];
      list.push(this.mapGameToDto(g));
      byDate.set(kstDateKey, list);
    });

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

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private getDayOfWeek(date: Date): string {
    const dayOfWeekMap = ['일', '월', '화', '수', '목', '금', '토'];
    return dayOfWeekMap[date.getDay()];
  }

  private getStartEndOfDate(date: Date): [Date, Date] {
    const start = new Date(date);
    const end = new Date(date);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return [start, end];
  }

  private mapGameToDto(game: Game): GameDto {
    // 시간도 KST 기준으로 포맷
    const kstTime = game.startTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul',
    }); // e.g. '14:30'

    return {
      gameId: game.id,
      time: kstTime,
      status: game.status as GameStatus,
      winnerTeamId: game.winnerTeamId ?? null,
      inning: game.gameStat?.inning ?? null,
      inningHalf: game.gameStat?.inningHalf ?? null,
      homeTeam: {
        id: game.homeTeamId,
        name: game.homeTeam.name,
        score: game.gameStat?.homeScore ?? null,
      },
      awayTeam: {
        id: game.awayTeamId,
        name: game.awayTeam.name,
        score: game.gameStat?.awayScore ?? null,
      },
      isForfeit: game.isForfeit,
    };
  }

  async startGame(
    gameId: number,
  ): Promise<{ success: boolean; message: string; gameStat: GameStat }> {
    return this.dataSource.transaction(async (m) => {
      const game = await this.findGameWithTeams(gameId, m);

      // 1) 선발 batter/pitcher 조회 & 검증
      const [homeBat, awayBat] = await Promise.all([
        this.getStartingBatter(gameId, game.homeTeamId, m),
        this.getStartingBatter(gameId, game.awayTeamId, m),
      ]);
      const [homePit, awayPit] = await Promise.all([
        this.getStartingPitcher(gameId, game.homeTeamId, m),
        this.getStartingPitcher(gameId, game.awayTeamId, m),
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

      // 3) 부모(Game) 상태만 UPDATE (stat FK 건드릴 필요 없음)
      await m.update(Game, gameId, { status: GameStatus.IN_PROGRESS });

      return {
        success: true,
        message: '게임이 시작되었습니다.',
        gameStat,
      };
    });
  }

  private async findGameWithTeams(
    gameId: number,
    manager: EntityManager,
  ): Promise<Game> {
    const game = await manager.findOne(Game, {
      where: { id: gameId },
      relations: ['homeTeam', 'awayTeam'],
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
    teamId: number,
    manager: EntityManager,
  ): Promise<BatterGameParticipation | null> {
    return manager.findOne(BatterGameParticipation, {
      where: {
        game: { id: gameId },
        team: { id: teamId },
        battingOrder: 1,
        substitutionOrder: 0,
      },
    });
  }

  private async getStartingPitcher(
    gameId: number,
    teamId: number,
    manager: EntityManager,
  ): Promise<PitcherGameParticipation | null> {
    return manager.findOne(PitcherGameParticipation, {
      where: {
        game: { id: gameId },
        team: { id: teamId },
        substitutionOrder: 0,
      },
    });
  }

  async endGame(
    gameId: number,
    scoreDto: SimpleScoreRequestDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.dataSource.transaction(async (manager) => {
      const game = await manager.findOne(Game, {
        where: { id: gameId },
        relations: ['gameStat'],
      });

      if (!game) {
        throw new BaseException(
          `게임 ID ${gameId}를 찾을 수 없습니다.`,
          ErrorCodes.GAME_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      if (game.status !== GameStatus.IN_PROGRESS) {
        throw new BaseException(
          '게임이 진행 중이지 않습니다.',
          ErrorCodes.GAME_NOT_IN_PROGRESS,
          HttpStatus.BAD_REQUEST,
        );
      }

      const inning = game.gameStat.inning;
      const inningHalf = game.gameStat.inningHalf;

      const existing = await manager.findOne(GameInningStat, {
        where: { game: { id: gameId }, inning, inningHalf },
      });
      if (existing)
        throw new BaseException(
          '이미 해당 이닝 점수가 존재합니다.',
          ErrorCodes.GAME_INNING_STAT_ALREADY_EXISTS,
          HttpStatus.BAD_REQUEST,
        );

      const newInningStat = manager.create(GameInningStat, {
        game,
        inning,
        inningHalf,
        runs: scoreDto.runs,
      });

      await manager.save(newInningStat);

      if (inningHalf === InningHalf.TOP) {
        game.gameStat.awayScore += scoreDto.runs;
      } else {
        game.gameStat.homeScore += scoreDto.runs;
      }
      await manager.save(game.gameStat);

      await manager.update(Game, gameId, { status: GameStatus.EDITING });
    });
    return { success: true, message: '게임 점수가 저장되었습니다.' };
  }

  /**
   * 게임을 최종 완료 상태로 변경하고 관련된 토너먼트 통계를 업데이트합니다.
   * @param gameId 최종 완료할 게임 ID
   */
  async finalizeGame(
    gameId: number,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Finalizing game with ID: ${gameId}`);

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
      if (game.status !== GameStatus.EDITING) {
        throw new BaseException(
          `게임이 수정 가능한 상태가 아닙니다. 현재 상태: ${game.status}`,
          ErrorCodes.GAME_NOT_EDITABLE,
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
      await this.updateTeamTournamentStats(game, manager);

      // 5. 개별 선수 통계 업데이트
      await this.gameStatsService.updatePlayerStats(gameId);

      // 6. 게임 상태 업데이트
      await manager.update(Game, gameId, { status: GameStatus.FINALIZED });

      this.logger.log(`Successfully finalized game ID: ${gameId}`);
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
          team: { id: game.homeTeamId },
          tournament: { id: game.tournamentId },
        },
      }),
      manager.findOne(TeamTournament, {
        where: {
          team: { id: game.awayTeamId },
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
      winnerTeamId = game.homeTeamId;
      this.logger.debug(
        `Home team win: ${game.homeTeam.name} (${game.gameStat.homeScore}) vs ${game.awayTeam.name} (${game.gameStat.awayScore})`,
      );
    } else if (game.gameStat.homeScore < game.gameStat.awayScore) {
      // 원정팀 승리
      homeTeamTournament.losses += 1;
      awayTeamTournament.wins += 1;
      winnerTeamId = game.awayTeamId;
      this.logger.debug(
        `Away team win: ${game.homeTeam.name} (${game.gameStat.homeScore}) vs ${game.awayTeam.name} (${game.gameStat.awayScore})`,
      );
    } else {
      // 무승부
      homeTeamTournament.draws += 1;
      awayTeamTournament.draws += 1;
      this.logger.debug(
        `Draw: ${game.homeTeam.name} (${game.gameStat.homeScore}) vs ${game.awayTeam.name} (${game.gameStat.awayScore})`,
      );
    }

    await manager.update(Game, game.id, { winnerTeamId });

    // 5. 팀 토너먼트 통계 저장
    await Promise.all([
      manager.save(TeamTournament, homeTeamTournament),
      manager.save(TeamTournament, awayTeamTournament),
    ]);

    this.logger.log(
      `Successfully updated team tournament stats for game ID: ${game.id}`,
    );
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
      });

      if (!game) {
        throw new BaseException(
          '게임을 찾을 수 없습니다.',
          ErrorCodes.GAME_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      if (
        winnerTeamId !== game.homeTeamId &&
        winnerTeamId !== game.awayTeamId
      ) {
        throw new BaseException(
          '유효하지 않은 승자 팀 ID입니다.',
          ErrorCodes.INVALID_INPUT,
          HttpStatus.BAD_REQUEST,
        );
      }
      game.status = GameStatus.FINALIZED;
      game.winnerTeamId = winnerTeamId;
      game.isForfeit = true;

      const [homeTeamTournament, awayTeamTournament] = await Promise.all([
        manager.findOne(TeamTournament, {
          where: {
            team: { id: game.homeTeamId },
            tournament: { id: game.tournamentId },
          },
        }),
        manager.findOne(TeamTournament, {
          where: {
            team: { id: game.awayTeamId },
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

      if (winnerTeamId === game.homeTeamId) {
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

    tournament.phase = PhaseType.KNOCKOUT;
    return this.tournamentRepository.save(tournament);
  }
}
