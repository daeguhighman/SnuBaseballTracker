import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryRunner, Repository } from 'typeorm';
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
  GameResultsResponseDto,
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
      relations: ['player'],
    });
    if (!currentBatter) {
      throw new BaseException(
        `현재 타자 참여 ID ${currentBatterParticipationId}를 찾을 수 없습니다.`,
        ErrorCodes.PARTICIPATION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      playerId: currentBatter.playerId,
      playerName: currentBatter.player.name,
      position: currentBatter.position,
      battingOrder: currentBatter.battingOrder,
      isWc: currentBatter.player.isWc,
      isElite: currentBatter.player.isElite,
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
        relations: ['player'],
      });
    if (!currentPitcher) {
      throw new BaseException(
        `현재 투수 참여 ID ${currentPitcherParticipationId}를 찾을 수 없습니다.`,
        ErrorCodes.PARTICIPATION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      playerId: currentPitcher.playerId,
      playerName: currentPitcher.player.name,
      position: 'P',
      isWc: currentPitcher.player.isWc,
      isElite: currentPitcher.player.isElite,
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
        currentBatter.team.id,
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
        //   playerName: nextBatter.player.name,
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
    teamId: number,
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
      .andWhere('b.teamId = :teamId')
      .andWhere('b.battingOrder = :nextOrder')
      .getQuery();

    const next = await qb
      .leftJoinAndSelect('batter.player', 'player')
      .where('batter.game.id = :gameId', { gameId })
      .andWhere('batter.team.id = :teamId', { teamId })
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
      case PlateAppearanceResult.ETC:
        batterStat.etcs++;
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
      relations: ['batterGameParticipation', 'batterGameParticipation.player'],
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
        etcs: batterStats.etcs || 0, // 기타 결과
      };

      // 5. 스탯 검증 및 조정
      const adjustedStats = BatterStatsValidator.adjustStats(currentStats, {
        PA: updateDto.PA,
        AB: updateDto.AB,
        H: updateDto.H,
        '2B': updateDto['2B'],
        '3B': updateDto['3B'],
        HR: updateDto.HR,
        BB: updateDto.BB,
        SAC: updateDto.SAC,
      });

      // 6. 조정된 스탯 적용
      batterStats.plateAppearances = adjustedStats.plateAppearances;
      batterStats.atBats = adjustedStats.atBats;
      batterStats.singles = adjustedStats.singles;
      batterStats.doubles = adjustedStats.doubles;
      batterStats.triples = adjustedStats.triples;
      batterStats.homeRuns = adjustedStats.homeRuns;
      batterStats.walks = adjustedStats.walks;
      batterStats.sacrificeFlies = adjustedStats.sacrificeFlies;
      batterStats.etcs = adjustedStats.etcs; // 기타 결과도 업데이트

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
      batterGameStatsId: batterStats.id,
      playerName: batterStats.batterGameParticipation.player.name,
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
      BB: batterStats.walks,
      SAC: batterStats.sacrificeFlies,
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
        'pitcherGameParticipation.player',
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
      pitcherGameStatsId: pitcherGameStat.id,
      playerName: pitcherGameStat.pitcherGameParticipation.player.name,
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

      if (game.status !== GameStatus.EDITING) {
        throw new BaseException(
          `Game with ID ${gameId} is not in editing state`,
          ErrorCodes.GAME_NOT_EDITABLE,
          HttpStatus.BAD_REQUEST,
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

      // 게임 상태 업데이트 (필요한 경우)
      // game.status = GameStatus.STATS_PROCESSED;
      // await queryRunner.manager.save(Game, game);

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
    // 1. 모든 게임 기록 한 번에 조회
    const batterGameStats = await queryRunner.manager.find(BatterGameStat, {
      where: { batterGameParticipation: { game: { id: gameId } } },
      relations: ['batterGameParticipation'],
    });

    if (batterGameStats.length === 0) return [];

    // 2. 필요한 PlayerTournament ID 목록 수집
    const playerIds = batterGameStats
      .map((stat) => stat.batterGameParticipation?.playerId)
      .filter((id) => id !== undefined);

    // 3. 필요한 PlayerTournament 레코드 한 번에 조회
    const playerTournaments = await queryRunner.manager.find(PlayerTournament, {
      where: {
        player: { id: In(playerIds) },
        tournament: { id: tournamentId },
      },
      relations: ['player'],
    });

    // 빠른 조회를 위한 맵 생성
    const playerTournamentMap = new Map<number, PlayerTournament>();
    playerTournaments.forEach((pt) => {
      playerTournamentMap.set(pt.player.id, pt);
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

    for (const gameStat of batterGameStats) {
      const playerId = gameStat.batterGameParticipation?.playerId;
      if (!playerId) continue;

      const playerTournament = playerTournamentMap.get(playerId);
      if (!playerTournament) {
        this.logger.warn(
          `PlayerTournament 레코드를 찾을 수 없음: 선수 ID ${playerId}, 토너먼트 ID ${tournamentId}`,
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

      // 누적 통계 업데이트
      this.updateBatterStatCounts(cumulativeStat, gameStat);

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
      relations: ['pitcherGameParticipation'],
    });

    // 2. 경기별 스탯이 없으면 빈 배열 반환
    if (pitcherGameStats.length === 0) return [];

    // 3. 해당 경기에 투수로 참여한 선수들의 ID 추출
    const playerIds = pitcherGameStats
      .map((stat) => stat.pitcherGameParticipation?.playerId)
      .filter((id) => id !== undefined);

    // 4. 해당 경기에 투수로 참여한 선수들의 PlayerTournament 레코드 조회
    const playerTournaments = await queryRunner.manager.find(PlayerTournament, {
      where: {
        player: { id: In(playerIds) },
        tournament: { id: tournamentId },
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
      const playerId = gameStat.pitcherGameParticipation?.playerId;
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
    stat.etcs = 0;
    stat.battingAverage = 0;
    stat.onBasePercentage = 0;
    stat.sluggingPercentage = 0;
    stat.ops = 0;
  }
  private initializePitcherStat(stat: PitcherStat): void {
    stat.strikeouts = 0;
  }
  private updatePitcherStatCounts(
    cumulativeStat: PitcherStat,
    gameStat: PitcherGameStat,
  ): void {
    cumulativeStat.strikeouts += gameStat.strikeouts || 0;
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
    cumulativeStat.etcs += gameStat.etcs || 0;
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

  async getGameResults(gameId: number): Promise<GameResultsResponseDto> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['homeTeam', 'awayTeam'],
    });

    if (!game) {
      throw new BaseException(
        `Game with ID ${gameId} not found`,
        ErrorCodes.GAME_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    if (!game.homeTeamId || !game.awayTeamId) {
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
        where: { game: { id: gameId }, team: { id: game.homeTeamId } },
        relations: ['player', 'batterGameStat'],
        order: { battingOrder: 'ASC', substitutionOrder: 'ASC' }, // Order by substitution first, then batting order
      });
    const awayBatterParticipations =
      await this.batterGameParticipationRepository.find({
        where: { game: { id: gameId }, team: { id: game.awayTeamId } },
        relations: ['player', 'batterGameStat'],
        order: { battingOrder: 'ASC', substitutionOrder: 'ASC' },
      });

    // 4. Fetch Pitcher Stats
    const homePitcherParticipations =
      await this.pitcherGameParticipationRepository.find({
        where: { game: { id: gameId }, team: { id: game.homeTeamId } },
        relations: ['player', 'pitcherGameStat'],
        order: { substitutionOrder: 'ASC' }, // Order by substitution order
      });
    const awayPitcherParticipations =
      await this.pitcherGameParticipationRepository.find({
        where: { game: { id: gameId }, team: { id: game.awayTeamId } },
        relations: ['player', 'pitcherGameStat'],
        order: { substitutionOrder: 'ASC' },
      });

    // 5. Map to DTO
    const response = new GameResultsResponseDto();

    response.scoreboard = inningStats.map((stat) => ({
      inning: stat.inning,
      inningHalf: stat.inningHalf, // Assuming type is 'TOP' | 'BOT'
      runs: stat.runs ?? 0, // Handle potential null runs
    }));

    response.teamSummary = {
      home: {
        id: game.homeTeamId,
        name: game.homeTeam.name,
        runs: gameStat?.homeScore ?? 0,
        hits: gameStat?.homeHits ?? 0,
      },
      away: {
        id: game.awayTeamId,
        name: game.awayTeam.name,
        runs: gameStat?.awayScore ?? 0,
        hits: gameStat?.awayHits ?? 0,
      },
    };

    const mapBatterStats = (participation: BatterGameParticipation) => ({
      batterGameStatsId: participation.batterGameStat?.id ?? 0, // Use the ID from the related stats entity
      playerName: participation.player.name,
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
      BB: participation.batterGameStat?.walks ?? 0,
      SAC: participation.batterGameStat?.sacrificeFlies ?? 0,
    });

    response.batterStats = {
      home: homeBatterParticipations
        .filter((p) => p.player && p.batterGameStat)
        .map(mapBatterStats),
      away: awayBatterParticipations
        .filter((p) => p.player && p.batterGameStat)
        .map(mapBatterStats),
    };

    const mapPitcherStats = (participation: PitcherGameParticipation) => ({
      pitcherGameStatsId: participation.pitcherGameStat?.id ?? 0, // Use the ID from the related stats entity
      playerName: participation.player.name,
      K: participation.pitcherGameStat?.strikeouts ?? 0,
    });

    response.pitcherStats = {
      home: homePitcherParticipations
        .filter((p) => p.player && p.pitcherGameStat)
        .map(mapPitcherStats),
      away: awayPitcherParticipations
        .filter((p) => p.player && p.pitcherGameStat)
        .map(mapPitcherStats),
    };

    return response;
  }
}
