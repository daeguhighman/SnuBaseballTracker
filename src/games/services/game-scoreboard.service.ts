import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Game } from '../entities/game.entity';
import { GameStat } from '../entities/game-stat.entity';
import { InningHalf } from '@common/enums/inning-half.enum';
import {
  ScoreboardResponseDto,
  SimpleScoreRequestDto,
  InningHalfScoreUpdateDto,
} from '../dtos/score.dto';
import { GameInningStat } from '../entities/game-inning-stat.entity';
import { ErrorCodes } from '@/common/exceptions/error-codes.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseException } from '@/common/exceptions/base.exception';
@Injectable()
export class GameScoreboardService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GameStat)
    private readonly gameStatRepository: Repository<GameStat>,
    private readonly dataSource: DataSource,
  ) {}
  async createInningStat(gameId: number, scoreDto: SimpleScoreRequestDto) {
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

      const inning = game.gameStat.inning;
      const inningHalf = game.gameStat.inningHalf;

      const existing = await queryRunner.manager.findOne(GameInningStat, {
        where: { game: { id: gameId }, inning, inningHalf },
      });
      if (existing)
        throw new BaseException(
          '이미 해당 이닝 점수가 존재합니다.',
          ErrorCodes.GAME_INNING_STAT_ALREADY_EXISTS,
          HttpStatus.BAD_REQUEST,
        );

      const newInningStat = queryRunner.manager.create(GameInningStat, {
        game,
        inning,
        inningHalf,
        runs: scoreDto.runs,
      });
      await queryRunner.manager.save(newInningStat);

      this.updateTeamScore(game.gameStat, inningHalf, scoreDto.runs);
      await queryRunner.manager.save(game.gameStat);

      await queryRunner.commitTransaction();
      return this.getScoreboard(gameId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
  updateTeamScore(gameStat: GameStat, half: InningHalf, diff: number): void {
    if (half === InningHalf.TOP) {
      gameStat.awayScore += diff;
    } else {
      gameStat.homeScore += diff;
    }
  }

  async changeInning(gameId: number) {
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
    const isLastInning =
      gameStat.inning === 7 && gameStat.inningHalf === InningHalf.BOT;

    if (isLastInning) {
      throw new BaseException(
        '7회 종료 후 이닝을 변경할 수 없습니다.',
        ErrorCodes.CANNOT_CHANGE_INNING_AFTER_7TH_INNING,
        HttpStatus.BAD_REQUEST,
      );
    }

    this.advanceInning(gameStat);
    await this.gameStatRepository.save(gameStat);
  }

  async getScoreboard(gameId: number): Promise<ScoreboardResponseDto> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['homeTeam', 'awayTeam', 'gameStat', 'inningStats'],
      order: {
        inningStats: {
          inning: 'ASC',
          inningHalf: 'ASC',
        },
      },
    });

    if (!game) {
      throw new BaseException(
        `게임 ID ${gameId}를 찾을 수 없습니다.`,
        ErrorCodes.GAME_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const scoreboard = game.inningStats.map((inningStat) => ({
      inning: inningStat.inning,
      inningHalf: inningStat.inningHalf,
      runs: inningStat.runs,
    }));

    const teamSummary = {
      home: {
        id: game.homeTeamId,
        name: game.homeTeam.name,
        runs: game.gameStat.homeScore,
        hits: game.gameStat.homeHits,
      },
      away: {
        id: game.awayTeamId,
        name: game.awayTeam.name,
        runs: game.gameStat.awayScore,
        hits: game.gameStat.awayHits,
      },
    };

    return { scoreboard, teamSummary };
  }
  async updateInningStat(
    gameId: number,
    inning: number,
    inningHalf: InningHalf,
    scoreDto: InningHalfScoreUpdateDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const game = await queryRunner.manager.findOne(Game, {
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

      const inningStat = await queryRunner.manager.findOne(GameInningStat, {
        where: {
          game: { id: gameId },
          inning,
          inningHalf,
        },
      });

      if (!inningStat) {
        throw new BaseException(
          `해당 이닝 점수를 찾을 수 없습니다.`,
          ErrorCodes.GAME_INNING_STAT_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      const scoreDiff = scoreDto.runs - inningStat.runs;
      inningStat.runs = scoreDto.runs;
      await queryRunner.manager.save(inningStat);

      this.updateTeamScore(game.gameStat, inningHalf, scoreDiff);
      await queryRunner.manager.save(game.gameStat);

      await queryRunner.commitTransaction();
      return this.getScoreboard(gameId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
  private advanceInning(gameStat: GameStat): void {
    if (gameStat.inningHalf === InningHalf.TOP) {
      gameStat.inningHalf = InningHalf.BOT;
    } else {
      gameStat.inning += 1;
      gameStat.inningHalf = InningHalf.TOP;
    }
  }
}
