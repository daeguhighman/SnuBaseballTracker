// 외부 모듈
import { Repository, DataSource, EntityManager, Not, IsNull } from 'typeorm';

// NestJS 관련 모듈
import { Injectable, HttpStatus, Inject, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// Enums
import { BracketPosition, MatchStage } from '@common/enums/match-stage.enum';
import { GameStatus } from '@common/enums/game-status.enum';
import { InningHalf } from '@common/enums/inning-half.enum';
import { PhaseType } from '@common/enums/phase-type.enum';

// Entities
import { BatterGameParticipation } from '@games/entities/batter-game-participation.entity';
import { Game } from '@games/entities/game.entity';
import { GameInningStat } from '@games/entities/game-inning-stat.entity';
import { GameStat } from '@/games/entities/game-stat.entity';
import { PitcherGameParticipation } from '@games/entities/pitcher-game-participation.entity';
import { TeamTournament } from '@teams/entities/team-tournament.entity';
import { Tournament } from '@tournaments/entities/tournament.entity';
import { Umpire } from '@umpires/entities/umpire.entity';

// Repositories
import { GameRepository } from '../repositories/game.repository';

// DTOs
import { GameDto, GamesByDatesResponseDto } from '@games/dtos/game.dto';
import { SimpleScoreRequestDto } from '@games/dtos/score.dto';
import {
  TournamentGameDto,
  TournamentScheduleResponseDto,
} from '@games/dtos/tournament-schedule.dto';

// Services
import { GameStatsService } from '@games/services/game-stats.service';

// Exceptions & Errors
import { BaseException } from '@common/exceptions/base.exception';
import { ErrorCodes } from '@common/exceptions/error-codes.enum';

// Logger
import { AppLogger } from '@common/logger/logger.service';

import { mapGamesByDatesToDto, mapGameToDto } from '@games/mappers/game.mapper';
import { DateUtils } from '@common/utils/date.utils';
import { UmpireAuthGuard } from '@/auth/guards/umpire-auth-guard';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Representative } from '@/players/entities/representative.entity';

@Injectable()
export class GameCoreService {
  constructor(
    private readonly dataSource: DataSource,

    // Services
    private readonly gameStatsService: GameStatsService,

    // Repositories
    @Inject('GAME_REPOSITORY')
    private readonly gameRepository: ReturnType<typeof GameRepository>,
    @InjectRepository(Umpire)
    private readonly umpireRepository: Repository<Umpire>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Representative)
    private readonly representativeRepository: Repository<Representative>,
  ) {}

  async getSchedules(
    startDate: string,
    endDate: string,
    userId?: string,
  ): Promise<GamesByDatesResponseDto> {
    const startDateTime = DateUtils.startOfDay(startDate);
    const endDateTime = DateUtils.endOfDay(endDate);

    const games = await this.gameRepository.getGamesBetweenDates(
      startDate,
      endDate,
    );

    // --- 날짜별 그룹핑 ---
    const groupedGames: Record<string, GameDto[]> = {};

    for (const game of games) {
      const key = DateUtils.formatKst(game.startTime);

      // 권한 정보 계산
      let permissions:
        | {
            canRecord: boolean;
            canSubmitLineup: { home: boolean; away: boolean };
          }
        | undefined;
      if (userId) {
        try {
          permissions = await this.calculateGamePermissions(game.id, userId);
        } catch (error) {
          // 권한 계산 실패 시 기본값 사용
          permissions = {
            canRecord: false,
            canSubmitLineup: { home: false, away: false },
          };
        }
      }

      if (!groupedGames[key]) {
        groupedGames[key] = [];
      }
      groupedGames[key].push(mapGameToDto(game, permissions));
    }

    return mapGamesByDatesToDto(startDateTime, endDateTime, groupedGames);
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
      relations: ['homeTeam', 'awayTeam', 'gameStat'],
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
      winnerTeamId: game.winnerTeamId ?? null,
      homeTeam: {
        id: game.homeTeamId,
        name: game.homeTeam?.name ?? null,
        score: game.gameStat?.homeScore ?? null,
      },
      awayTeam: {
        id: game.awayTeamId,
        name: game.awayTeam?.name ?? null,
        score: game.gameStat?.awayScore ?? null,
      },
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
    } else if (game.gameStat.homeScore < game.gameStat.awayScore) {
      // 원정팀 승리
      homeTeamTournament.losses += 1;
      awayTeamTournament.wins += 1;
      winnerTeamId = game.awayTeamId;
    } else {
      // 무승부
      homeTeamTournament.draws += 1;
      awayTeamTournament.draws += 1;
    }

    await manager.update(Game, game.id, { winnerTeamId });

    // 5. 팀 토너먼트 통계 저장
    await Promise.all([
      manager.save(TeamTournament, homeTeamTournament),
      manager.save(TeamTournament, awayTeamTournament),
    ]);
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
        ? game.homeTeamId
        : homeScore < awayScore
          ? game.awayTeamId
          : null;

    const loserTeamId =
      homeScore !== awayScore
        ? homeScore > awayScore
          ? game.awayTeamId
          : game.homeTeamId
        : null;

    // 2) 현재 게임에 승자 업데이트
    await manager.update(Game, game.id, { winnerTeamId });

    // 3) 다음 경기 매핑 (QF→SF, SF→F)
    type Slot = 'homeTeamId' | 'awayTeamId';
    const transitionMap: Partial<
      Record<BracketPosition, { nextPos: BracketPosition; nextSlot: Slot }>
    > = {
      [BracketPosition.QF_1]: {
        nextPos: BracketPosition.SF_1,
        nextSlot: 'awayTeamId',
      },
      [BracketPosition.QF_2]: {
        nextPos: BracketPosition.SF_1,
        nextSlot: 'homeTeamId',
      },
      [BracketPosition.QF_3]: {
        nextPos: BracketPosition.SF_2,
        nextSlot: 'awayTeamId',
      },
      [BracketPosition.QF_4]: {
        nextPos: BracketPosition.SF_2,
        nextSlot: 'homeTeamId',
      },
      [BracketPosition.SF_1]: {
        nextPos: BracketPosition.F,
        nextSlot: 'awayTeamId',
      },
      [BracketPosition.SF_2]: {
        nextPos: BracketPosition.F,
        nextSlot: 'homeTeamId',
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

      // 5) “준결승 → 결승” 이동일 때만 패자를 3·4위전에 고정 배치
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
          thirdGame.awayTeamId = loserTeamId;
        } else {
          // SF2 패자는 homeTeam
          thirdGame.homeTeamId = loserTeamId;
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

  /**
   * 경기에 대한 사용자의 권한을 계산합니다.
   * @param gameId 경기 ID
   * @param userId 사용자 ID
   * @returns 권한 정보
   */
  async calculateGamePermissions(
    gameId: number,
    userId: string,
  ): Promise<{
    canRecord: boolean;
    canSubmitLineup: { home: boolean; away: boolean };
  }> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['homeTeam', 'awayTeam', 'recordUmpire'],
    });

    if (!game) {
      throw new BaseException(
        `게임 ID ${gameId}를 찾을 수 없습니다.`,
        ErrorCodes.GAME_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // 심판 권한 확인
    const canRecord = game.recordUmpireId === parseInt(userId);

    // 팀 대표자 권한 확인
    const [homeRepresentative, awayRepresentative] = await Promise.all([
      this.representativeRepository.findOne({
        where: {
          teamTournamentId: game.homeTeamId,
          userId: userId,
        },
      }),
      this.representativeRepository.findOne({
        where: {
          teamTournamentId: game.awayTeamId,
          userId: userId,
        },
      }),
    ]);

    return {
      canRecord,
      canSubmitLineup: {
        home: !!homeRepresentative,
        away: !!awayRepresentative,
      },
    };
  }
}
