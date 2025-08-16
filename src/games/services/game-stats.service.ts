import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import { GameStat } from '@games/entities/game-stat.entity';
import { InningHalf } from '@common/enums/inning-half.enum';
import { Game } from '@games/entities/game.entity';
import { GameStatus } from '@common/enums/game-status.enum';
import { BatterGameParticipation } from '@games/entities/batter-game-participation.entity';
import { PitcherGameParticipation } from '@games/entities/pitcher-game-participation.entity';
import { CurrentBatterResponseDto } from '@games/dtos/current-player.dto';
import { CurrentPitcherResponseDto } from '@games/dtos/current-player.dto';
import { PlateAppearanceResult } from '@/common/enums/plate-appearance-result.enum';
import { BatterGameStat } from '@games/entities/batter-game-stat.entity';
import { PitcherGameStat } from '@games/entities/pitcher-game-stat.entity';
import { BatterPlateAppearanceRequestDto } from '@games/dtos/plate-appearance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';
import {
  BatterDailyStats,
  GameResultResponseDto,
  PitcherDailyStats,
  UpdatePitcherStatsDto,
} from '../dtos/game-result.dto';
import { UpdateBatterStatsDto } from '../dtos/game-result.dto';
import { BatterStatsValidator } from '../functions/validators/batter-stats.validator';
import { BatterStat } from '@/records/entities/batter-stat.entity';
import { PitcherStat } from '@/records/entities/pitcher-stat.entity';
import { PlayerTournament } from '@/players/entities/player-tournament.entity';
import { Decimal } from 'decimal.js';
import { In } from 'typeorm';
import { GameInningStat } from '../entities/game-inning-stat.entity';
import { ErrorCodes } from '@/common/exceptions/error-codes.enum';
import { BaseException } from '@/common/exceptions/base.exception';
import { Runner } from '@/plays/entities/runner.entity';
import { VirtualInningStat } from '../entities/virtual-inning-stat.entity';
import { Play } from '@/plays/entities/play.entity';
import { GameAuthService } from './game-auth.service';

@Injectable()
export class GameStatsService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(BatterGameParticipation)
    private readonly batterGameParticipationRepository: Repository<BatterGameParticipation>,
    @InjectRepository(PitcherGameParticipation)
    private readonly pitcherGameParticipationRepository: Repository<PitcherGameParticipation>,
    private readonly dataSource: DataSource,
    @InjectRepository(BatterGameStat)
    private readonly batterGameStatRepository: Repository<BatterGameStat>,
    @InjectRepository(PitcherGameStat)
    private readonly pitcherGameStatRepository: Repository<PitcherGameStat>,
    @InjectRepository(GameInningStat)
    private readonly gameInningStatRepository: Repository<GameInningStat>,
    @InjectRepository(GameStat)
    private readonly gameStatRepository: Repository<GameStat>,
    @InjectRepository(Runner)
    private readonly runnerRepository: Repository<Runner>,
    @InjectRepository(Play)
    private readonly playRepository: Repository<Play>,
    private readonly gameAuthService: GameAuthService,
  ) {}
  private readonly logger = new Logger(GameStatsService.name);

  async getCurrentBatter(
    gameId: number,
    teamType: 'home' | 'away',
  ): Promise<CurrentBatterResponseDto> {
    const game = await this.gameRepository.findOne({
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
    const gameStat = game.gameStat;
    const currentBatterParticipationId =
      teamType === 'home'
        ? gameStat.homeBatterParticipationId
        : gameStat.awayBatterParticipationId;
    const currentBatter = await this.batterGameParticipationRepository.findOne({
      where: { id: currentBatterParticipationId },
      relations: ['playerTournament', 'playerTournament.player'],
    });
    if (!currentBatter) {
      throw new BaseException(
        `현재 타자 참여 ID ${currentBatterParticipationId}를 찾을 수 없습니다.`,
        ErrorCodes.PARTICIPATION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      id: currentBatter.playerTournament.id, // playerTournamentId 사용
      name: currentBatter.playerTournament.player.name,
      position: currentBatter.position,
      battingOrder: currentBatter.battingOrder,
      isWc: currentBatter.playerTournament.isWildcard,
      isElite: currentBatter.playerTournament.isElite,
    };
  }

  async getCurrentPitcher(
    gameId: number,
    teamType: 'home' | 'away',
  ): Promise<CurrentPitcherResponseDto> {
    const game = await this.gameRepository.findOne({
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
    const gameStat = game.gameStat;
    const currentPitcherParticipationId =
      teamType === 'home'
        ? gameStat.homePitcherParticipationId
        : gameStat.awayPitcherParticipationId;
    const currentPitcher =
      await this.pitcherGameParticipationRepository.findOne({
        where: { id: currentPitcherParticipationId },
        relations: ['playerTournament', 'playerTournament.player'],
      });
    if (!currentPitcher) {
      throw new BaseException(
        `현재 투수 참여 ID ${currentPitcherParticipationId}를 찾을 수 없습니다.`,
        ErrorCodes.PARTICIPATION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      id: currentPitcher.playerTournament.id, // playerTournamentId 사용
      name: currentPitcher.playerTournament.player.name,
      position: 'P',
      isWc: currentPitcher.playerTournament.isWildcard,
      isElite: currentPitcher.playerTournament.isElite,
    };
  }

  async recordPlateAppearance(
    gameId: number,
    batterPlateAppearanceDto: BatterPlateAppearanceRequestDto,
  ): Promise<{ success: boolean; message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const game = await queryRunner.manager.findOne(Game, {
        where: { id: gameId },
        relations: ['gameStat'],
      });
      if (!game)
        throw new BaseException(
          `게임 ID ${gameId}를 찾을 수 없습니다.`,
          ErrorCodes.GAME_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );

      const isTopInning = game.gameStat.inningHalf === InningHalf.TOP;
      const batterParticipationId = isTopInning
        ? game.gameStat.awayBatterParticipationId
        : game.gameStat.homeBatterParticipationId;
      const pitcherParticipationId = isTopInning
        ? game.gameStat.homePitcherParticipationId
        : game.gameStat.awayPitcherParticipationId;

      // 현재 타자 정보 조회
      const currentBatter = await queryRunner.manager.findOne(
        BatterGameParticipation,
        {
          where: { id: batterParticipationId },
          relations: ['game', 'team'],
        },
      );

      if (!currentBatter) {
        throw new BaseException(
          '현재 타자 정보를 찾을 수 없습니다.',
          ErrorCodes.PARTICIPATION_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      const nextBatter = await this.getNextBatter(
        queryRunner,
        gameId,
        currentBatter.teamTournament.id,
        currentBatter.battingOrder,
      );

      if (!nextBatter) {
        throw new BaseException(
          '다음 타자 정보를 찾을 수 없습니다.',
          ErrorCodes.PARTICIPATION_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      // 타자, 투수 기록 조회 또는 생성
      const batterGameStat = await queryRunner.manager.findOne(BatterGameStat, {
        where: { batterGameParticipation: { id: batterParticipationId } },
      });
      if (!batterGameStat) {
        throw new BaseException(
          '타자 기록을 찾을 수 없습니다.',
          ErrorCodes.BATTER_GAME_STAT_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      const pitcherGameStat = await queryRunner.manager.findOne(
        PitcherGameStat,
        {
          where: { pitcherGameParticipation: { id: pitcherParticipationId } },
        },
      );
      if (!pitcherGameStat) {
        throw new BaseException(
          '투수 기록을 찾을 수 없습니다.',
          ErrorCodes.PITCHER_GAME_STAT_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      // 안타 여부 체크를 위한 변수
      const isHit = this.updateStats(
        batterGameStat,
        pitcherGameStat,
        batterPlateAppearanceDto.result,
      );

      // 안타 수 업데이트
      if (isHit) {
        isTopInning ? game.gameStat.awayHits++ : game.gameStat.homeHits++;
      }

      // 다음 타자로 업데이트
      if (isTopInning) {
        game.gameStat.awayBatterParticipationId = nextBatter.id;
      } else {
        game.gameStat.homeBatterParticipationId = nextBatter.id;
      }

      // 변경사항 저장
      await queryRunner.manager.save(batterGameStat);
      await queryRunner.manager.save(pitcherGameStat);
      await queryRunner.manager.save(game.gameStat);

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: '타자 타석 기록 성공',
        // nextBatter: {
        //   playerId: nextBatter.playerId,
        //   name: nextBatter.player.name,
        //   battingOrder: nextBatter.battingOrder,
        //   position: nextBatter.position,
        //   isWc: nextBatter.player.isWc,
        //   isElite: nextBatter.player.isElite,
        // },
      };
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      this.logger.error(error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async getNextBatter(
    queryRunner: QueryRunner,
    gameId: number,
    teamTournamentId: number,
    order: number,
  ) {
    const nextOrder = (order % 9) + 1;

    const qb = queryRunner.manager.createQueryBuilder(
      BatterGameParticipation,
      'batter',
    );
    const subQuery = qb
      .subQuery()
      .select('MAX(b.substitutionOrder)', 'maxOrder')
      .from(BatterGameParticipation, 'b')
      .where('b.gameId = :gameId')
      .andWhere('b.teamTournamentId = :teamTournamentId')
      .andWhere('b.battingOrder = :nextOrder')
      .getQuery();

    const next = await qb
      .leftJoinAndSelect('batter.player', 'player')
      .where('batter.game.id = :gameId', { gameId })
      .andWhere('batter.teamTournament.id = :teamTournamentId', {
        teamTournamentId,
      })
      .andWhere('batter.battingOrder = :nextOrder', { nextOrder })
      .andWhere(`batter.substitutionOrder = ${subQuery}`)
      .getOne();

    if (!next)
      throw new BaseException(
        '다음 타자 정보를 찾을 수 없습니다.',
        ErrorCodes.PARTICIPATION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    return next;
  }
  private updateStats(
    batterStat: BatterGameStat,
    pitcherStat: PitcherGameStat,
    result: PlateAppearanceResult,
  ): boolean {
    batterStat.plateAppearances++;
    let isHit = false;

    switch (result) {
      case PlateAppearanceResult.SINGLE:
        batterStat.atBats++;
        batterStat.singles++;
        isHit = true;
        break;
      case PlateAppearanceResult.DOUBLE:
        batterStat.atBats++;
        batterStat.doubles++;
        isHit = true;
        break;
      case PlateAppearanceResult.TRIPLE:
        batterStat.atBats++;
        batterStat.triples++;
        isHit = true;
        break;
      case PlateAppearanceResult.HOMERUN:
        batterStat.atBats++;
        batterStat.homeRuns++;
        isHit = true;
        break;
      case PlateAppearanceResult.WALK:
        batterStat.walks++;
        break;
      case PlateAppearanceResult.SACRIFICE_FLY:
        batterStat.sacrificeFlies++;
        break;
      case PlateAppearanceResult.OUT:
        batterStat.atBats++;
        break;
      case PlateAppearanceResult.STRIKEOUT:
      case PlateAppearanceResult.STRIKEOUT_DROP:
        batterStat.atBats++;
        pitcherStat.strikeouts++;
        break;
      case PlateAppearanceResult.FIELDERS_CHOICE:
        batterStat.atBats++;
        break;
    }

    return isHit;
  }

  async updateBatterGameStats(
    gameId: number,
    batterGameStatsId: number,
    updateDto: UpdateBatterStatsDto,
  ): Promise<BatterDailyStats> {
    // 1. Verify the game exists
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new BaseException(
        `Game with ID ${gameId} not found`,
        ErrorCodes.GAME_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // 2. Find the batter stats by ID
    const batterStats = await this.batterGameStatRepository.findOne({
      where: { id: batterGameStatsId },
      relations: [
        'batterGameParticipation',
        'batterGameParticipation.playerTournament',
        'batterGameParticipation.playerTournament.player',
      ],
    });

    if (!batterStats || !batterStats.batterGameParticipation) {
      throw new BaseException(
        `Batter stats with ID ${batterGameStatsId} not found for game ${gameId}`,
        ErrorCodes.BATTER_GAME_STAT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // 3. Verify the stats belong to the specified game
    if (batterStats.batterGameParticipation.gameId !== gameId) {
      throw new BaseException(
        `Batter stats ID ${batterGameStatsId} does not belong to game ${gameId}`,
        ErrorCodes.BAD_REQUEST,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // 4. 현재 스탯 데이터 수집
      const currentStats = {
        plateAppearances: batterStats.plateAppearances || 0,
        atBats: batterStats.atBats || 0,
        singles: batterStats.singles || 0,
        doubles: batterStats.doubles || 0,
        triples: batterStats.triples || 0,
        homeRuns: batterStats.homeRuns || 0,
        walks: batterStats.walks || 0,
        sacrificeFlies: batterStats.sacrificeFlies || 0,
        runs: batterStats.runs || 0,
        runsBattedIn: batterStats.runsBattedIn || 0,
        strikeouts: batterStats.strikeouts || 0,
        sacrificeBunts: batterStats.sacrificeBunts || 0,
      };

      // 5. 스탯 검증 및 조정
      const adjustedStats = BatterStatsValidator.adjustStats(currentStats, {
        PA: updateDto.PA,
        AB: updateDto.AB,
        H: updateDto.H,
        '2B': updateDto['2B'],
        '3B': updateDto['3B'],
        HR: updateDto.HR,
        R: updateDto.R,
        RBI: updateDto.RBI,
        SH: updateDto.SH,
        SF: updateDto.SF,
        BB: updateDto.BB,
        SO: updateDto.SO,
      });

      // 6. 조정된 스탯 적용
      batterStats.plateAppearances = adjustedStats.plateAppearances;
      batterStats.atBats = adjustedStats.atBats;
      batterStats.singles = adjustedStats.singles;
      batterStats.doubles = adjustedStats.doubles;
      batterStats.triples = adjustedStats.triples;
      batterStats.homeRuns = adjustedStats.homeRuns;
      batterStats.runs = adjustedStats.runs;
      batterStats.runsBattedIn = adjustedStats.runsBattedIn;
      batterStats.walks = adjustedStats.walks;
      batterStats.strikeouts = adjustedStats.strikeouts;
      batterStats.sacrificeFlies = adjustedStats.sacrificeFlies;
      batterStats.sacrificeBunts = adjustedStats.sacrificeBunts;

      // 7. Save the updated stats
      await this.batterGameStatRepository.save(batterStats);
    } catch (error) {
      if (error instanceof BaseException) {
        throw error;
      }
      throw new BaseException(
        `타자 스탯 업데이트 중 오류가 발생했습니다: ${error.message}`,
        ErrorCodes.INTERNAL_SERVER_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 8. Return the response DTO
    return {
      id: batterStats.id,
      name: batterStats.batterGameParticipation.playerTournament.player.name,
      battingOrder: batterStats.batterGameParticipation.battingOrder,
      substitutionOrder: batterStats.batterGameParticipation.substitutionOrder,
      PA: batterStats.plateAppearances,
      AB: batterStats.atBats,
      H:
        batterStats.singles +
        batterStats.doubles +
        batterStats.triples +
        batterStats.homeRuns,
      '2B': batterStats.doubles,
      '3B': batterStats.triples,
      HR: batterStats.homeRuns,
      R: batterStats.runs,
      RBI: batterStats.runsBattedIn,
      SH: batterStats.sacrificeBunts,
      SF: batterStats.sacrificeFlies,
      BB: batterStats.walks,
      SO: batterStats.strikeouts,
    };
  }

  async updatePitcherGameStats(
    gameId: number,
    pitcherGameStatsId: number,
    updateDto: UpdatePitcherStatsDto,
  ): Promise<PitcherDailyStats> {
    // 1. Verify the game exists
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new BaseException(
        `Game with ID ${gameId} not found`,
        ErrorCodes.GAME_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // 2. Find the pitcher stats by ID
    const pitcherGameStat = await this.pitcherGameStatRepository.findOne({
      where: { id: pitcherGameStatsId },
      relations: [
        'pitcherGameParticipation',
        'pitcherGameParticipation.playerTournament',
        'pitcherGameParticipation.playerTournament.player',
      ],
    });

    if (!pitcherGameStat || !pitcherGameStat.pitcherGameParticipation) {
      throw new BaseException(
        `Pitcher stats with ID ${pitcherGameStatsId} not found for game ${gameId}`,
        ErrorCodes.PITCHER_GAME_STAT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // 3. Verify the stats belong to the specified game
    if (pitcherGameStat.pitcherGameParticipation.gameId !== gameId) {
      throw new BaseException(
        `Pitcher stats ID ${pitcherGameStatsId} does not belong to game ${gameId}`,
        ErrorCodes.BAD_REQUEST,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 4. Update the stats fields
    if (updateDto.K !== undefined) pitcherGameStat.strikeouts = updateDto.K;

    // 5. Save the updated stats
    await this.pitcherGameStatRepository.save(pitcherGameStat);

    // 6. Return the response DTO
    return {
      id: pitcherGameStat.id,
      name: pitcherGameStat.pitcherGameParticipation.playerTournament.player
        .name,
      IP: pitcherGameStat.inningPitchedOuts || 0,
      R: pitcherGameStat.allowedRuns || 0,
      ER: pitcherGameStat.earnedRuns || 0,
      BB: pitcherGameStat.walks || 0,
      K: pitcherGameStat.strikeouts || 0,
    };
  }

  async updatePlayerStats(gameId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // 트랜잭션 시작
      await queryRunner.startTransaction();

      // 게임 정보 조회
      const game = await queryRunner.manager.findOne(Game, {
        where: { id: gameId },
        relations: ['tournament'], // tournament 관계 명시적으로 필요
      });

      if (!game) {
        throw new BaseException(
          `Game with ID ${gameId} not found`,
          ErrorCodes.GAME_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      const tournamentId = game.tournament?.id;
      if (!tournamentId) {
        throw new BaseException(
          `Game with ID ${gameId} has no associated tournament`,
          ErrorCodes.TOURNAMENT_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      // 분리된 메서드로 모든 타자/투수 통계 업데이트
      const [batterStats, pitcherStats] = await Promise.all([
        this.updateBatterCumulativeStats(queryRunner, gameId, tournamentId),
        this.updatePitcherCumulativeStats(queryRunner, gameId, tournamentId),
      ]);

      // 데이터베이스에 저장
      if (batterStats.length > 0) {
        await queryRunner.manager.save(BatterStat, batterStats);
        this.logger.log(
          `Saved ${batterStats.length} batter stats for game ${gameId}`,
        );
      }

      if (pitcherStats.length > 0) {
        await queryRunner.manager.save(PitcherStat, pitcherStats);
        this.logger.log(
          `Saved ${pitcherStats.length} pitcher stats for game ${gameId}`,
        );
      }
      // 트랜잭션 커밋
      await queryRunner.commitTransaction();
      this.logger.log(`Successfully processed stats for game ID: ${gameId}`);
    } catch (error) {
      // 에러 발생 시 롤백
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      this.logger.error(
        `Error while updating player stats for game ${gameId}:`,
        error.stack,
      );

      // 구체적인 에러 타입에 따라 다른 예외 던지기
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to update player statistics for game ${gameId}: ${error.message}`,
      );
    } finally {
      // 항상 쿼리 러너 해제
      await queryRunner.release();
    }
  }

  // 타자 스탯 업데이트 분리
  private async updateBatterCumulativeStats(
    queryRunner: QueryRunner,
    gameId: number,
    tournamentId: number,
  ): Promise<BatterStat[]> {
    // 1. 모든 게임 기록 한 번에 조회 (방식 변경)
    const batterGameParticipations = await queryRunner.manager.find(
      BatterGameParticipation,
      {
        where: { game: { id: gameId } },
        relations: ['playerTournament', 'batterGameStat'],
      },
    );

    if (batterGameParticipations.length === 0) return [];

    // 2. 필요한 PlayerTournament ID 목록 수집
    const playerTournamentIds = batterGameParticipations
      .map((participation) => participation.playerTournament?.id)
      .filter((id) => id !== undefined);

    // 3. 필요한 PlayerTournament 레코드 한 번에 조회 (player 관계 포함)
    const playerTournaments = await queryRunner.manager.find(PlayerTournament, {
      where: { id: In(playerTournamentIds) },
      relations: ['player'],
    });

    // 빠른 조회를 위한 맵 생성
    const playerTournamentMap = new Map<number, PlayerTournament>();
    playerTournaments.forEach((pt) => {
      playerTournamentMap.set(pt.id, pt);
    });

    // 4. 필요한 BatterStat 레코드 한 번에 조회
    const existingBatterStats = await queryRunner.manager.find(BatterStat, {
      where: {
        playerTournament: { id: In(playerTournaments.map((pt) => pt.id)) },
      },
      relations: ['playerTournament'],
    });

    // 빠른 조회를 위한 맵 생성
    const batterStatMap = new Map<number, BatterStat>();
    existingBatterStats.forEach((bs) => {
      batterStatMap.set(bs.playerTournament.id, bs);
    });

    // 5. 모든 BatterStat 처리
    const cumulativeBatterStatsToSave: BatterStat[] = [];

    for (const participation of batterGameParticipations) {
      const playerTournamentId = participation.playerTournament?.id;
      if (!playerTournamentId) {
        this.logger.warn(
          `PlayerTournament ID가 없는 BatterGameParticipation: ${participation.id}`,
        );
        continue;
      }

      const playerTournament = playerTournamentMap.get(playerTournamentId);
      if (!playerTournament) {
        this.logger.warn(
          `PlayerTournament 레코드를 찾을 수 없음: ID ${playerTournamentId}`,
        );
        continue;
      }

      // 기존 통계 찾기 또는 새로 생성
      let cumulativeStat = batterStatMap.get(playerTournament.id);
      if (!cumulativeStat) {
        cumulativeStat = new BatterStat();
        cumulativeStat.playerTournament = playerTournament;
        // 기본값 초기화
        this.initializeBatterStat(cumulativeStat);
      }

      // 누적 통계 업데이트 (batterGameStat이 있는 경우에만)
      if (participation.batterGameStat) {
        this.updateBatterStatCounts(
          cumulativeStat,
          participation.batterGameStat,
        );
      }

      // 파생 통계 계산 (타율, 출루율 등)
      this.calculateBatterDerivedStats(cumulativeStat);

      cumulativeBatterStatsToSave.push(cumulativeStat);
    }

    return cumulativeBatterStatsToSave;
  }

  // 투수 스탯 업데이트 유사하게 분리
  private async updatePitcherCumulativeStats(
    queryRunner: QueryRunner,
    gameId: number,
    tournamentId: number,
  ): Promise<PitcherStat[]> {
    // 1. 해당 경기의 투수 경기별 스탯을 모두 조회
    const pitcherGameStats = await queryRunner.manager.find(PitcherGameStat, {
      where: { pitcherGameParticipation: { game: { id: gameId } } },
      relations: [
        'pitcherGameParticipation',
        'pitcherGameParticipation.playerTournament',
        'pitcherGameParticipation.playerTournament.player',
      ],
    });

    // 2. 경기별 스탯이 없으면 빈 배열 반환
    if (pitcherGameStats.length === 0) return [];

    // 3. 해당 경기에 투수로 참여한 선수들의 ID 추출
    const playerIds = pitcherGameStats
      .map((s) => s.pitcherGameParticipation?.playerTournament?.player?.id)
      .filter((id): id is number => typeof id === 'number');

    // 4. 해당 경기에 투수로 참여한 선수들의 PlayerTournament 레코드 조회
    const playerTournaments = await queryRunner.manager.find(PlayerTournament, {
      where: {
        player: { id: In(playerIds) },
        teamTournament: { tournament: { id: tournamentId } },
      },
      relations: ['player'],
    });

    // 5. 해당 경기에 투수로 참여한 선수들의 PlayerTournament 레코드를 맵으로 저장
    const playerTournamentMap = new Map<number, PlayerTournament>();
    playerTournaments.forEach((pt) => {
      playerTournamentMap.set(pt.player.id, pt);
    });

    // 6. 해당 경기에 투수로 참여한 선수들의 기존 통계 조회
    const existingPitcherStats = await queryRunner.manager.find(PitcherStat, {
      where: {
        playerTournament: { id: In(playerTournaments.map((pt) => pt.id)) },
      },
      relations: ['playerTournament'],
    });

    // 7. playerTournamentId로 PitcherStat을 빠르게 찾을 수 있도록 Map 생성
    const pitcherStatMap = new Map<number, PitcherStat>();
    existingPitcherStats.forEach((ps) => {
      pitcherStatMap.set(ps.playerTournament.id, ps);
    });

    // 9. 각 경기별 투수 스탯을 순회하며 누적 스탯을 갱신
    for (const gameStat of pitcherGameStats) {
      const playerId =
        gameStat.pitcherGameParticipation?.playerTournament.player.id;
      if (!playerId) continue;

      // 10. 해당 경기에 투수로 참여한 선수들의 PlayerTournament 레코드 조회
      const playerTournament = playerTournamentMap.get(playerId);
      if (!playerTournament) {
        this.logger.warn(
          `PlayerTournament 레코드를 찾을 수 없음: 선수 ID ${playerId}, 토너먼트 ID ${tournamentId}`,
        );
        continue;
      }

      // 11. 기존 통계 찾기 또는 새로 생성
      let cumulativeStat = pitcherStatMap.get(playerTournament.id);
      if (!cumulativeStat) {
        cumulativeStat = new PitcherStat();
        cumulativeStat.playerTournament = playerTournament;
        // 기본값 초기화
        this.initializePitcherStat(cumulativeStat);
        pitcherStatMap.set(playerTournament.id, cumulativeStat);
      }

      // 누적 통계 업데이트
      this.updatePitcherStatCounts(cumulativeStat, gameStat);

      this.calculatePitcherDerivedStats(cumulativeStat);
    }

    return Array.from(pitcherStatMap.values());
  }

  // 기본값 초기화 헬퍼 메서드
  private initializeBatterStat(stat: BatterStat): void {
    stat.plateAppearances = 0;
    stat.atBats = 0;
    stat.hits = 0;
    stat.singles = 0;
    stat.doubles = 0;
    stat.triples = 0;
    stat.homeRuns = 0;
    stat.walks = 0;
    stat.sacrificeFlies = 0;
    stat.sacrificeBunts = 0;
    stat.runs = 0;
    stat.runsBattedIn = 0;
    stat.battingAverage = 0;
    stat.onBasePercentage = 0;
    stat.sluggingPercentage = 0;
    stat.ops = 0;
  }
  private initializePitcherStat(stat: PitcherStat): void {
    stat.inningPitchedOuts = 0;
    stat.strikeouts = 0;
    stat.walks = 0;
    stat.allowedHits = 0;
    stat.allowedRuns = 0;
    stat.earnedRuns = 0;
    stat.era = 0;
  }
  private updatePitcherStatCounts(
    cumulativeStat: PitcherStat,
    gameStat: PitcherGameStat,
  ): void {
    cumulativeStat.inningPitchedOuts += gameStat.inningPitchedOuts || 0;
    cumulativeStat.strikeouts += gameStat.strikeouts || 0;
    cumulativeStat.walks += gameStat.walks || 0;
    cumulativeStat.allowedHits += gameStat.allowedHits || 0;
    cumulativeStat.allowedRuns += gameStat.allowedRuns || 0;
    cumulativeStat.earnedRuns += gameStat.earnedRuns || 0;
  }
  private calculatePitcherDerivedStats(stat: PitcherStat): void {
    stat.era = this.calculateERA(stat.earnedRuns, stat.inningPitchedOuts);
  }
  // 통계 업데이트 헬퍼 메서드
  private updateBatterStatCounts(
    cumulativeStat: BatterStat,
    gameStat: BatterGameStat,
  ): void {
    cumulativeStat.plateAppearances += gameStat.plateAppearances || 0;
    cumulativeStat.atBats += gameStat.atBats || 0;
    // 총 안타 수 계산
    const gameHits =
      (gameStat.singles || 0) +
      (gameStat.doubles || 0) +
      (gameStat.triples || 0) +
      (gameStat.homeRuns || 0);
    cumulativeStat.hits += gameHits;
    cumulativeStat.singles += gameStat.singles || 0;
    cumulativeStat.doubles += gameStat.doubles || 0;
    cumulativeStat.triples += gameStat.triples || 0;
    cumulativeStat.homeRuns += gameStat.homeRuns || 0;
    cumulativeStat.walks += gameStat.walks || 0;
    cumulativeStat.sacrificeFlies += gameStat.sacrificeFlies || 0;
    cumulativeStat.sacrificeBunts += gameStat.sacrificeBunts || 0;
    cumulativeStat.runs += gameStat.runs || 0;
    cumulativeStat.runsBattedIn += gameStat.runsBattedIn || 0;
  }

  // 파생 통계 계산 헬퍼 메서드 (비동기 제거)
  private calculateBatterDerivedStats(stat: BatterStat): void {
    // 타율 계산
    stat.battingAverage = this.calculateBattingAverage(stat.hits, stat.atBats);
    // 출루율 계산
    stat.onBasePercentage = this.calculateOnBasePercentage(
      stat.hits,
      stat.atBats,
      stat.walks,
      stat.sacrificeFlies,
    );
    // 장타율 계산
    stat.sluggingPercentage = this.calculateSluggingPercentage(
      stat.singles,
      stat.doubles,
      stat.triples,
      stat.homeRuns,
      stat.atBats,
    );
    // OPS 계산
    stat.ops = this.calculateOps(
      stat.onBasePercentage,
      stat.sluggingPercentage,
    );
  }

  // 비동기 제거 및 정확한 타율 계산
  private calculateBattingAverage(hits: number, atBats: number): number {
    if (atBats === 0) return 0;

    // 정확한 소수점 계산을 위해 Decimal 사용
    return new Decimal(hits)
      .dividedBy(atBats)
      .toDecimalPlaces(3, Decimal.ROUND_DOWN) // MLB 규칙에 따라 버림(ROUND_DOWN)
      .toNumber();
  }

  // 정확한 출루율 계산
  private calculateOnBasePercentage(
    hits: number,
    atBats: number,
    walks: number,
    sacrificeFlies: number,
  ): number {
    // 정확한 OBP 계산식: (H + BB + HBP) / (AB + BB + HBP + SF)
    const numerator = hits + walks;
    const denominator = atBats + walks + sacrificeFlies;

    if (denominator === 0) return 0;

    return new Decimal(numerator)
      .dividedBy(denominator)
      .toDecimalPlaces(3, Decimal.ROUND_DOWN)
      .toNumber();
  }

  // 정확한 장타율 계산
  private calculateSluggingPercentage(
    singles: number,
    doubles: number,
    triples: number,
    homeRuns: number,
    atBats: number,
  ): number {
    if (atBats === 0) return 0;

    // SLG = (단타 + 2루타×2 + 3루타×3 + 홈런×4) / 타수
    const totalBases = singles + doubles * 2 + triples * 3 + homeRuns * 4;

    return new Decimal(totalBases)
      .dividedBy(atBats)
      .toDecimalPlaces(3, Decimal.ROUND_DOWN)
      .toNumber();
  }

  // OPS 계산
  private calculateOps(
    onBasePercentage: number,
    sluggingPercentage: number,
  ): number {
    // OPS = OBP + SLG, 소수점 3자리로 반올림
    return new Decimal(onBasePercentage)
      .plus(sluggingPercentage)
      .toDecimalPlaces(3, Decimal.ROUND_DOWN)
      .toNumber();
  }

  private calculateERA(earnedRuns: number, inningPitchedOuts: number): number {
    if (inningPitchedOuts === 0) {
      return earnedRuns > 0 ? 99.99 : 0; // 아웃 없이 실점했으면 관례상 큰 값, 아니면 0.00
    }

    return new Decimal(earnedRuns)
      .times(27) // 9이닝 × 3아웃 = 27
      .dividedBy(inningPitchedOuts)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP) // 표준 표기
      .toNumber();
  }

  async getGameResult(
    gameId: number,
    userId?: string,
  ): Promise<GameResultResponseDto> {
    const game = await this.gameRepository.findOne({
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
    if (!game.homeTeam || !game.awayTeam) {
      throw new BaseException(
        `Team information is missing for game ${gameId}`,
        ErrorCodes.TEAM_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // 1. Fetch Scoreboard (Inning Scores)
    const inningStats = await this.gameInningStatRepository.find({
      where: { game: { id: gameId } },
      order: { inning: 'ASC', inningHalf: 'ASC' },
    });

    // 2. Fetch Team Summary (Total Runs/Hits)
    // Assuming GameStats stores cumulative stats per game.
    // Might need adjustment if GameStats is structured differently (e.g., per inning half)
    const gameStat = await this.gameStatRepository.findOne({
      where: { game: { id: gameId } },
      order: { id: 'DESC' }, // Get the latest stat entry if multiple exist
    });

    // if (!gameStat) {
    //   // Handle case where game hasn't started or stats aren't recorded yet
    //   // Depending on requirements, could return default values or throw error
    //   console.warn(
    //     `GameStats not found for game ${gameId}. Returning partial results.`,
    //   );
    //   // Or throw new NotFoundException(`Game stats not found for game ${gameId}`);
    // }

    // 3. Fetch Batter Stats
    const homeBatterParticipations =
      await this.batterGameParticipationRepository.find({
        where: {
          game: { id: gameId },
          teamTournament: { id: game.homeTeam.id },
        },
        relations: [
          'playerTournament',
          'playerTournament.player',
          'batterGameStat',
        ],
        order: { battingOrder: 'ASC', substitutionOrder: 'ASC' }, // Order by substitution first, then batting order
      });
    const awayBatterParticipations =
      await this.batterGameParticipationRepository.find({
        where: {
          game: { id: gameId },
          teamTournament: { id: game.awayTeam.id },
        },
        relations: [
          'playerTournament',
          'playerTournament.player',
          'batterGameStat',
        ],
        order: { battingOrder: 'ASC', substitutionOrder: 'ASC' },
      });

    // 4. Fetch Pitcher Stats
    const homePitcherParticipations =
      await this.pitcherGameParticipationRepository.find({
        where: {
          game: { id: gameId },
          teamTournament: { id: game.homeTeam.id },
        },
        relations: [
          'playerTournament',
          'playerTournament.player',
          'pitcherGameStat',
        ],
        order: { substitutionOrder: 'ASC' }, // Order by substitution order
      });
    const awayPitcherParticipations =
      await this.pitcherGameParticipationRepository.find({
        where: {
          game: { id: gameId },
          teamTournament: { id: game.awayTeam.id },
        },
        relations: [
          'playerTournament',
          'playerTournament.player',
          'pitcherGameStat',
        ],
        order: { substitutionOrder: 'ASC' },
      });

    // 5. Map to DTO
    const response = new GameResultResponseDto();

    // canRecord 설정 - 사용자가 admin인지 확인
    response.canRecord = await this.gameAuthService.checkUserIsAdmin(userId);

    // 이닝별 점수를 홈팀/원정팀 형태로 변환
    const inningsMap = new Map<
      number,
      { away: number | null; home: number | null }
    >();

    // 초기화: 모든 이닝에 대해 null 값 설정
    for (
      let i = 1;
      i <= Math.max(...inningStats.map((stat) => stat.inning));
      i++
    ) {
      inningsMap.set(i, { away: null, home: null });
    }

    // 각 이닝 통계를 순회하며 점수 설정
    inningStats.forEach((inningStat) => {
      // startSeq와 endSeq가 같으면 해당 이닝은 실제로 진행되지 않은 이닝이므로 제외
      if (inningStat.startSeq === inningStat.endSeq) {
        return;
      }

      const inning = inningsMap.get(inningStat.inning) || {
        away: null,
        home: null,
      };

      if (inningStat.inningHalf === 'TOP') {
        inning.away = inningStat.runs ?? 0;
      } else {
        inning.home = inningStat.runs ?? 0;
      }

      inningsMap.set(inningStat.inning, inning);
    });

    // Map을 배열로 변환
    const innings = Array.from(inningsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([inning, scores]) => ({
        inning,
        away: scores.away,
        home: scores.home,
      }));

    response.scoreboard = { innings };

    response.teamSummary = {
      home: {
        id: game.homeTeam.team.id,
        name: game.homeTeam.team.name,
        runs: gameStat?.homeScore ?? 0,
        hits: gameStat?.homeHits ?? 0,
      },
      away: {
        id: game.awayTeam.team.id,
        name: game.awayTeam.team.name,
        runs: gameStat?.awayScore ?? 0,
        hits: gameStat?.awayHits ?? 0,
      },
    };

    const mapBatterStats = (participation: BatterGameParticipation) => ({
      id: participation.batterGameStat?.id ?? 0,
      name: participation.playerTournament.player.name,
      battingOrder: participation.battingOrder,
      substitutionOrder: participation.substitutionOrder,
      PA: participation.batterGameStat?.plateAppearances ?? 0,
      AB: participation.batterGameStat?.atBats ?? 0,
      H:
        (participation.batterGameStat?.singles ?? 0) +
        (participation.batterGameStat?.doubles ?? 0) +
        (participation.batterGameStat?.triples ?? 0) +
        (participation.batterGameStat?.homeRuns ?? 0),
      '2B': participation.batterGameStat?.doubles ?? 0,
      '3B': participation.batterGameStat?.triples ?? 0,
      HR: participation.batterGameStat?.homeRuns ?? 0,
      R: participation.batterGameStat?.runs ?? 0,
      RBI: participation.batterGameStat?.runsBattedIn ?? 0,
      BB: participation.batterGameStat?.walks ?? 0,
      SO: participation.batterGameStat?.strikeouts ?? 0,
      SF: participation.batterGameStat?.sacrificeFlies ?? 0,
      SH: participation.batterGameStat?.sacrificeBunts ?? 0,
    });

    response.batterStats = {
      home: homeBatterParticipations
        .filter((p) => p.playerTournament && p.batterGameStat)
        .map(mapBatterStats),
      away: awayBatterParticipations
        .filter((p) => p.playerTournament && p.batterGameStat)
        .map(mapBatterStats),
    };

    const mapPitcherStats = (participation: PitcherGameParticipation) => ({
      id: participation.pitcherGameStat?.id ?? 0, // Use the ID from the related stats entity
      name: participation.playerTournament.player.name,
      IP: participation.pitcherGameStat?.inningPitchedOuts ?? 0,
      R: participation.pitcherGameStat?.allowedRuns ?? 0,
      ER: participation.pitcherGameStat?.earnedRuns ?? 0,
      K: participation.pitcherGameStat?.strikeouts ?? 0,
      BB: participation.pitcherGameStat?.walks ?? 0,
    });

    response.pitcherStats = {
      home: homePitcherParticipations
        .filter((p) => p.playerTournament && p.pitcherGameStat)
        .map(mapPitcherStats),
      away: awayPitcherParticipations
        .filter((p) => p.playerTournament && p.pitcherGameStat)
        .map(mapPitcherStats),
    };

    return response;
  }

  /**
   * 특정 타석(playId) 기준 경기 전체 스냅샷(PlaySnapshotResponse) 생성 (심판화면용, playerRecords 미포함)
   */
  async makePlaySnapshotUmpire(
    gameId: number,
    playId: number,
    manager: EntityManager,
  ): Promise<any> {
    const game = await manager.findOne(Game, {
      where: { id: gameId },
      relations: [
        'gameStat',
        'homeTeam',
        'homeTeam.team',
        'awayTeam',
        'awayTeam.team',
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
    if (!game) throw new Error('Game not found');

    const stat = game.gameStat;
    if (!stat) throw new Error('GameStat not found');

    // 1. 팀 정보
    const homeTeam = {
      id: game.homeTeam.id,
      name: game.homeTeam.team.name,
    };
    const awayTeam = {
      id: game.awayTeam.id,
      name: game.awayTeam.team.name,
    };

    // 2. 이닝별 점수 (home/awayScore 구분)
    const innings = [];
    let homeTotal = 0,
      awayTotal = 0;

    // 현재 이닝과 이닝하프 정보
    const currentInning = stat.inning;
    const currentInningHalf = stat.inningHalf;

    // 이닝별 점수 계산
    (game.inningStats || []).forEach((inningStat) => {
      const isTop = inningStat.inningHalf === 'TOP';
      const inningNumber = inningStat.inning;

      // 해당 이닝의 기존 기록 찾기
      const existingInning = innings.find((i) => i.inning === inningNumber);

      if (existingInning) {
        // 이미 존재하는 이닝이면 점수 추가
        if (isTop) {
          existingInning.away = inningStat.runs;
          awayTotal += inningStat.runs;
        } else {
          existingInning.home = inningStat.runs;
          homeTotal += inningStat.runs;
        }
      } else {
        // 새로운 이닝이면 생성
        const newInning = {
          inning: inningNumber,
          away: isTop ? inningStat.runs : null,
          home: isTop ? null : inningStat.runs,
        };
        innings.push(newInning);

        if (isTop) {
          awayTotal += inningStat.runs;
        } else {
          homeTotal += inningStat.runs;
        }
      }
    });

    // 현재 이닝까지의 모든 이닝을 생성 (아직 진행되지 않은 이닝은 null로)
    for (let i = 1; i <= currentInning; i++) {
      const existingInning = innings.find((inning) => inning.inning === i);

      if (!existingInning) {
        // 아직 기록이 없는 이닝 생성
        const newInning = {
          inning: i,
          away: null,
          home: null,
        };
        innings.push(newInning);
      } else {
        // 현재 이닝이고 아직 진행되지 않은 하프는 null로 설정
        if (i === currentInning) {
          if (currentInningHalf === 'TOP') {
            // 현재 1회초라면 1회말은 null
            existingInning.home = null;
          } else {
            // 현재 1회말이라면 1회초는 이미 기록되어 있음
          }
        }
      }
    }

    // 이닝 순서대로 정렬
    innings.sort((a, b) => a.inning - b.inning);

    const scoreboard = {
      innings,
      totals: {
        away: {
          R: awayTotal,
          H: stat.awayHits || 0,
        },
        home: {
          R: homeTotal,
          H: stat.homeHits || 0,
        },
      },
    };

    // 3. 라인업 정보
    const homeBatters = game.batterGameParticipations
      .filter((b) => b.teamTournamentId === game.homeTeam.id && b.isActive)
      .sort((a, b) => a.battingOrder - b.battingOrder);
    const awayBatters = game.batterGameParticipations
      .filter((b) => b.teamTournamentId === game.awayTeam.id && b.isActive)
      .sort((a, b) => a.battingOrder - b.battingOrder);
    const homePitcher = game.pitcherGameParticipations.filter(
      (p) => p.teamTournamentId === game.homeTeam.id && p.isActive,
    )[0];
    const awayPitcher = game.pitcherGameParticipations.filter(
      (p) => p.teamTournamentId === game.awayTeam.id && p.isActive,
    )[0];

    // 라인업 가공 함수
    function lineupObject(batters, pitcher) {
      return {
        batters: batters.map((b) => ({
          id: b.id,
          name: b.playerTournament.player.name,
          position: b.position,
          battingOrder: b.battingOrder,
          isElite: b.playerTournament.isElite,
        })),
        pitcher: {
          id: pitcher.id,
          name: pitcher.playerTournament.player.name,
          position: 'P',
          isElite: pitcher.playerTournament.isElite,
        },
      };
    }

    // 4. 현재 타자/투수 결정
    const isTopInning = stat.inningHalf === 'TOP';
    const currentBatter = isTopInning
      ? game.batterGameParticipations.find(
          (b) => b.id === stat.awayBatterParticipationId,
        )
      : game.batterGameParticipations.find(
          (b) => b.id === stat.homeBatterParticipationId,
        );
    const currentPitcher = isTopInning
      ? game.pitcherGameParticipations.find(
          (p) => p.id === stat.homePitcherParticipationId,
        )
      : game.pitcherGameParticipations.find(
          (p) => p.id === stat.awayPitcherParticipationId,
        );

    // 5. 주자 정보
    const actualRunnersOnBase = [];
    const runnerIds = [stat.onFirstGpId, stat.onSecondGpId, stat.onThirdGpId]
      .filter((id) => id !== null)
      .map((id) => Number(id));

    if (runnerIds.length > 0) {
      const runners = await this.batterGameParticipationRepository.find({
        where: { id: In(runnerIds) },
        relations: ['playerTournament', 'playerTournament.player'],
      });

      const runnerMap = new Map(runners.map((r) => [r.id, r]));

      if (stat.onFirstGpId && runnerMap.has(Number(stat.onFirstGpId))) {
        const firstGp = runnerMap.get(Number(stat.onFirstGpId));
        actualRunnersOnBase.push({
          base: 1,
          id: firstGp.id,
          name: firstGp.playerTournament.player.name,
        });
      }

      if (stat.onSecondGpId && runnerMap.has(Number(stat.onSecondGpId))) {
        const secondGp = runnerMap.get(Number(stat.onSecondGpId));
        actualRunnersOnBase.push({
          base: 2,
          id: secondGp.id,
          name: secondGp.playerTournament.player.name,
        });
      }

      if (stat.onThirdGpId && runnerMap.has(Number(stat.onThirdGpId))) {
        const thirdGp = runnerMap.get(Number(stat.onThirdGpId));
        actualRunnersOnBase.push({
          base: 3,
          id: thirdGp.id,
          name: thirdGp.playerTournament.player.name,
        });
      }
    }

    // 6. 아웃 카운트
    const inningStat = game.inningStats?.find(
      (s) => s.inning === stat.inning && s.inningHalf === stat.inningHalf,
    );
    const actualOuts = inningStat?.outs ?? 0;

    // 7. 현재 타자/투수 상세 정보
    const mapBatter = (b, resultCode = null) => ({
      id: b.id,
      name: b.playerTournament.player.name,
      position: b.position,
      battingOrder: b.battingOrder,
      isElite: b.playerTournament.isElite,
      battingResult: resultCode, // Play의 resultCode 사용
    });

    const mapPitcher = (p) => ({
      id: p.id,
      name: p.playerTournament.player.name,
      position: 'P',
      isElite: p.playerTournament.isElite,
    });

    // 8. 대기 타자들
    let waitingBatters = [];
    let offenseBatters = [];

    if (stat.inningHalf === 'TOP') {
      offenseBatters = awayBatters;
    } else {
      offenseBatters = homeBatters;
    }

    const currentOrder = currentBatter?.battingOrder ?? 1;

    for (let i = 1; i <= 3 && offenseBatters.length > 0; i++) {
      const nextOrder = ((currentOrder - 1 + i) % offenseBatters.length) + 1;
      const nextBatter = offenseBatters.find(
        (b) => b.battingOrder === nextOrder,
      );

      if (nextBatter) {
        waitingBatters.push({
          id: nextBatter.id,
          name: nextBatter.playerTournament.player.name,
          position: nextBatter.position,
          battingOrder: nextBatter.battingOrder,
          isElite: nextBatter.playerTournament.isElite,
        });
      }
    }

    // 9. 새로운 구조로 반환
    // 현재 이닝의 virtualInningStat 조회
    let virtualInningStat = null;
    let virtualRunnersOnBase = [];
    let virtualOuts = 0;

    if (inningStat?.errorFlag) {
      virtualInningStat = await manager.findOne(VirtualInningStat, {
        where: {
          originalInningStatId: inningStat.id,
        },
      });

      if (virtualInningStat) {
        // virtualInningStat에서 주자 정보 구성
        if (virtualInningStat.onFirstGpId) {
          const firstRunner =
            awayBatters.find(
              (b) => b.id === Number(virtualInningStat.onFirstGpId),
            ) ||
            homeBatters.find(
              (b) => b.id === Number(virtualInningStat.onFirstGpId),
            );
          if (firstRunner) {
            virtualRunnersOnBase.push({
              base: 1,
              id: firstRunner.id,
              name: firstRunner.playerTournament.player.name,
              position: firstRunner.position,
              battingOrder: firstRunner.battingOrder,
              isElite: firstRunner.playerTournament.isElite,
            });
          }
        }
        if (virtualInningStat.onSecondGpId) {
          const secondRunner =
            awayBatters.find(
              (b) => b.id === Number(virtualInningStat.onSecondGpId),
            ) ||
            homeBatters.find(
              (b) => b.id === Number(virtualInningStat.onSecondGpId),
            );
          if (secondRunner) {
            virtualRunnersOnBase.push({
              base: 2,
              id: secondRunner.id,
              name: secondRunner.playerTournament.player.name,
              position: secondRunner.position,
              battingOrder: secondRunner.battingOrder,
              isElite: secondRunner.playerTournament.isElite,
            });
          }
        }
        if (virtualInningStat.onThirdGpId) {
          const thirdRunner =
            awayBatters.find(
              (b) => b.id === Number(virtualInningStat.onThirdGpId),
            ) ||
            homeBatters.find(
              (b) => b.id === Number(virtualInningStat.onThirdGpId),
            );
          if (thirdRunner) {
            virtualRunnersOnBase.push({
              base: 3,
              id: thirdRunner.id,
              name: thirdRunner.playerTournament.player.name,
              position: thirdRunner.position,
              battingOrder: thirdRunner.battingOrder,
              isElite: thirdRunner.playerTournament.isElite,
            });
          }
        }
        virtualOuts = virtualInningStat.outs;
      }
    }

    return {
      playId,
      gameSummary: {
        inning: stat.inning,
        inningHalf: stat.inningHalf,
        awayTeam,
        homeTeam,
        scoreboard,
      },
      inningStats: {
        errorFlag: inningStat?.errorFlag ?? false,
        actual: {
          runnersOnBase: actualRunnersOnBase,
          outs: actualOuts,
        },
        virtual: inningStat?.errorFlag
          ? {
              runnersOnBase: virtualRunnersOnBase,
              outs: virtualOuts,
            }
          : {
              runnersOnBase: actualRunnersOnBase,
              outs: actualOuts,
            },
      },
      lineup: {
        away: lineupObject(awayBatters, awayPitcher),
        home: lineupObject(homeBatters, homePitcher),
      },
      currentAtBat: {
        batter: currentBatter ? mapBatter(currentBatter) : null,
        pitcher: currentPitcher ? mapPitcher(currentPitcher) : null,
      },
      waitingBatters,
    };
  }

  /**
   * 특정 타석(playId) 기준 경기 전체 스냅샷(PlaySnapshotResponse) 생성 (관중화면용, playerRecords 포함)
   */
  async makePlaySnapshotAudience(
    gameId: number,
    playId: number,
    manager: EntityManager,
  ): Promise<any> {
    // 1. Game, GameStat, Teams, InningStats, Participation, Player 등 relations 포함 조회
    const game = await manager.findOne(Game, {
      where: { id: gameId },
      relations: [
        'homeTeam',
        'homeTeam.team',
        'awayTeam',
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
    if (!game) throw new Error('Game not found');
    const stat = game.gameStat;
    if (!stat) throw new Error('GameStat not found');

    // 2. 이닝별 점수 (home/awayScore 구분)
    const innings = [];
    let homeTotal = 0,
      awayTotal = 0;

    // 현재 이닝과 이닝하프 정보
    const currentInning = stat.inning;
    const currentInningHalf = stat.inningHalf;

    // 이닝별 점수 계산
    (game.inningStats || []).forEach((inningStat) => {
      const isTop = inningStat.inningHalf === 'TOP';
      const inningNumber = inningStat.inning;

      // 해당 이닝의 기존 기록 찾기
      const existingInning = innings.find((i) => i.inning === inningNumber);

      if (existingInning) {
        // 이미 존재하는 이닝이면 점수 추가
        if (isTop) {
          existingInning.away = inningStat.runs;
          awayTotal += inningStat.runs;
        } else {
          existingInning.home = inningStat.runs;
          homeTotal += inningStat.runs;
        }
      } else {
        // 새로운 이닝이면 생성
        const newInning = {
          inning: inningNumber,
          away: isTop ? inningStat.runs : null,
          home: isTop ? null : inningStat.runs,
        };
        innings.push(newInning);

        if (isTop) {
          awayTotal += inningStat.runs;
        } else {
          homeTotal += inningStat.runs;
        }
      }
    });

    // 현재 이닝까지의 모든 이닝을 생성 (아직 진행되지 않은 이닝은 null로)
    for (let i = 1; i <= currentInning; i++) {
      const existingInning = innings.find((inning) => inning.inning === i);

      if (!existingInning) {
        // 아직 기록이 없는 이닝 생성
        const newInning = {
          inning: i,
          away: null,
          home: null,
        };
        innings.push(newInning);
      } else {
        // 현재 이닝이고 아직 진행되지 않은 하프는 null로 설정
        if (i === currentInning) {
          if (currentInningHalf === 'TOP') {
            // 현재 1회초라면 1회말은 null
            existingInning.home = null;
          } else {
            // 현재 1회말이라면 1회초는 이미 기록되어 있음
          }
        }
      }
    }

    // 이닝 순서대로 정렬
    innings.sort((a, b) => a.inning - b.inning);

    const scoreboard = {
      innings,
      totals: {
        away: {
          R: awayTotal,
          H: stat.awayHits || 0,
        },
        home: {
          R: homeTotal,
          H: stat.homeHits || 0,
        },
      },
    };

    function lineupObject(batters, pitcher) {
      return {
        batters: batters.map((b) => ({
          id: b.id, // 스냅샷에서는 BatterGameParticipation ID 사용
          name: b.playerTournament.player.name,
          position: b.position,
          battingOrder: b.battingOrder,
          isElite: b.playerTournament.isElite,
        })),
        pitcher: {
          id: pitcher.id, // 스냅샷에서는 PitcherGameParticipation ID 사용
          name: pitcher.playerTournament.player.name,
          position: 'P',
          isElite: pitcher.playerTournament.isElite,
        },
      };
    }

    const homeTeam = {
      id: game.homeTeam.id,
      name: game.homeTeam.team.name,
    };
    const awayTeam = {
      id: game.awayTeam.id,
      name: game.awayTeam.team.name,
    };
    const homeBatters = game.batterGameParticipations
      .filter((b) => b.teamTournamentId === game.homeTeam.id && b.isActive)
      .sort((a, b) => a.battingOrder - b.battingOrder);
    const awayBatters = game.batterGameParticipations
      .filter((b) => b.teamTournamentId === game.awayTeam.id && b.isActive)
      .sort((a, b) => a.battingOrder - b.battingOrder);
    const homePitcher = game.pitcherGameParticipations.filter(
      (p) => p.teamTournamentId === game.homeTeam.id && p.isActive,
    )[0];
    const awayPitcher = game.pitcherGameParticipations.filter(
      (p) => p.teamTournamentId === game.awayTeam.id && p.isActive,
    )[0];

    // 현재 타자/투수 결정 (이닝에 따른 공격/수비 팀 구분)
    const isTopInning = stat.inningHalf === 'TOP';
    const currentBatter = isTopInning
      ? game.batterGameParticipations.find(
          (b) => b.id === stat.awayBatterParticipationId,
        )
      : game.batterGameParticipations.find(
          (b) => b.id === stat.homeBatterParticipationId,
        );
    const currentPitcher = isTopInning
      ? game.pitcherGameParticipations.find(
          (p) => p.id === stat.homePitcherParticipationId,
        )
      : game.pitcherGameParticipations.find(
          (p) => p.id === stat.awayPitcherParticipationId,
        );
    const mapBatter = (b, resultCode = null) => ({
      id: b.id, // 스냅샷에서는 BatterGameParticipation ID 사용
      name: b.playerTournament.player.name,
      position: b.position,
      isElite: b.playerTournament.isElite,
      battingOrder: b.battingOrder,
      battingResult: resultCode, // Play의 resultCode 사용
      battingAverage: b.batterStats?.battingAverage ?? 0,
      todayStats: {
        PA: b.batterGameStat?.plateAppearances ?? 0,
        AB: b.batterGameStat?.atBats ?? 0,
        H: b.batterGameStat?.hits ?? 0,
        R: b.batterGameStat?.runs ?? 0,
        RBI: b.batterGameStat?.runsBattedIn ?? 0,
      },
    });
    const mapPitcher = (p) => ({
      id: p.id, // 스냅샷에서는 PitcherGameParticipation ID 사용
      name: p.playerTournament.player.name,
      position: 'P',
      isElite: p.playerTournament.isElite,
      ERA: p.pitcherStats?.ERA ?? 0,
      todayStats: {
        IP: p.pitcherGameStat?.inningPitchedOuts ?? 0,
        R: p.pitcherGameStat?.runs ?? 0,
        ER: p.pitcherGameStat?.earnedRuns ?? 0,
        H: p.pitcherGameStat?.hits ?? 0,
        K: p.pitcherGameStat?.strikeouts ?? 0,
        BB: p.pitcherGameStat?.walks ?? 0,
      },
    });
    // --- runnersOnBase 계산 (GameStat의 onFirstGpId, onSecondGpId, onThirdGpId 사용) ---
    const runnersOnBase = [];

    // 주자 정보를 직접 조회하여 구성
    const runnerIds = [stat.onFirstGpId, stat.onSecondGpId, stat.onThirdGpId]
      .filter((id) => id !== null)
      .map((id) => Number(id)); // 문자열을 숫자로 변환

    if (runnerIds.length > 0) {
      const runners = await this.batterGameParticipationRepository.find({
        where: { id: In(runnerIds) },
        relations: ['playerTournament', 'playerTournament.player'],
      });

      const runnerMap = new Map(runners.map((r) => [r.id, r]));

      if (stat.onFirstGpId && runnerMap.has(Number(stat.onFirstGpId))) {
        const firstGp = runnerMap.get(Number(stat.onFirstGpId));
        runnersOnBase.push({
          base: 1,
          id: firstGp.id,
          name: firstGp.playerTournament.player.name,
        });
      }

      if (stat.onSecondGpId && runnerMap.has(Number(stat.onSecondGpId))) {
        const secondGp = runnerMap.get(Number(stat.onSecondGpId));
        runnersOnBase.push({
          base: 2,
          id: secondGp.id,
          name: secondGp.playerTournament.player.name,
        });
      }

      if (stat.onThirdGpId && runnerMap.has(Number(stat.onThirdGpId))) {
        const thirdGp = runnerMap.get(Number(stat.onThirdGpId));
        runnersOnBase.push({
          base: 3,
          id: thirdGp.id,
          name: thirdGp.playerTournament.player.name,
        });
      }
    }
    // --- outcount 계산 ---
    const inningStat = game.inningStats?.find(
      (s) => s.inning === stat.inning && s.inningHalf === stat.inningHalf,
    );
    const outs = inningStat?.outs ?? 0;

    // --- 현재 이닝에서 타석에 들어선 타자들 찾기 ---
    const currentInningPlays = await this.playRepository.find({
      where: {
        gameId: gameId,
        gameInningStat: {
          inning: stat.inning,
          inningHalf: stat.inningHalf,
        },
      },
      relations: [
        'batter',
        'batter.playerTournament',
        'batter.batterGameStat',
        'batter.playerTournament.player',
      ],
      order: { seq: 'DESC' }, // 최신 타석부터 역순으로
    });

    // 현재 이닝에서 타석에 들어선 타자들을 역순으로 정렬 (최신 타석부터)
    const currentInningBatters = currentInningPlays.map((play) => ({
      ...play.batter, // BatterGameParticipation 객체 전체를 포함
      seq: play.seq, // 타석 순서
      resultCode: play.resultCode, // Play의 resultCode 추가
    }));

    // --- waitingBatters 계산 (현재 공격팀, 현재 타자 뒤 3명만) ---
    let waitingBatters = [];
    let offenseBatters = [];

    // 현재 공격팀의 타자들 결정
    if (stat.inningHalf === 'TOP') {
      offenseBatters = awayBatters; // 원정팀이 공격
    } else {
      offenseBatters = homeBatters; // 홈팀이 공격
    }

    // 현재 타자의 타순 찾기
    const currentOrder = currentBatter?.battingOrder ?? 1;

    // 다음 3명의 타자 찾기 (순환)
    for (let i = 1; i <= 3 && offenseBatters.length > 0; i++) {
      const nextOrder = ((currentOrder - 1 + i) % offenseBatters.length) + 1;
      const nextBatter = offenseBatters.find(
        (b) => b.battingOrder === nextOrder,
      );

      if (nextBatter) {
        waitingBatters.push({
          id: nextBatter.id, // 스냅샷에서는 BatterGameParticipation ID 사용
          name: nextBatter.playerTournament.player.name,
          position: nextBatter.position,
          battingOrder: nextBatter.battingOrder,
          isElite: nextBatter.playerTournament.isElite,
        });
      }
    }

    return {
      playId,
      gameSummary: {
        inning: stat.inning,
        inningHalf: stat.inningHalf,
        awayTeam,
        homeTeam,
        scoreboard,
      },
      lineup: {
        away: lineupObject(awayBatters, awayPitcher),
        home: lineupObject(homeBatters, homePitcher),
      },
      runnersOnBase,
      outs,
      waitingBatters,
      playerRecords: {
        batters: currentInningBatters.map((batter) =>
          mapBatter(batter, batter.resultCode),
        ),
        pitcher: currentPitcher ? mapPitcher(currentPitcher) : null,
      },
    };
  }

  /**
   * 해당 게임의 가장 최신 umpire snapshot을 가져오는 메서드
   */
  async getLatestUmpireSnapshot(gameId: number): Promise<any> {
    // 1. 게임이 존재하는지 확인
    const game = await this.gameRepository.findOne({
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

    // 2. 해당 게임의 가장 최신 play를 찾기
    const latestPlay = await this.playRepository.findOne({
      where: { gameId },
      order: { seq: 'DESC' },
    });

    if (!latestPlay) {
      throw new BaseException(
        `게임 ID ${gameId}의 플레이 기록을 찾을 수 없습니다.`,
        ErrorCodes.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // 3. 최신 play를 기준으로 umpire snapshot 생성
    return this.dataSource.transaction(async (manager) => {
      return await this.makePlaySnapshotUmpire(gameId, latestPlay.id, manager);
    });
  }
}
