import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Game } from '../entities/game.entity';
import { GameStat } from '../entities/game-stat.entity';
import { GameInningStat } from '../entities/game-inning-stat.entity';
import { InningHalf } from '@common/enums/inning-half.enum';
import {
  ScoreboardResponseDto,
  SimpleScoreRequestDto,
  InningHalfScoreUpdateDto,
} from '../dtos/score.dto';
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

  async changeInning(gameId: number, em: EntityManager, playSeq: number) {
    let game: Game;
    let gameStat: GameStat;

    if (em) {
      // 같은 EntityManager 사용
      game = await em.findOne(Game, {
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
      gameStat = game.gameStat;
    } else {
      // 기존 로직 (별도 EntityManager 사용)
      game = await this.gameRepository.findOne({
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
      gameStat = game.gameStat;
    }

    const isLastInning =
      gameStat.inning === 7 && gameStat.inningHalf === InningHalf.BOT;

    if (isLastInning) {
      throw new BaseException(
        '7회 종료 후 이닝을 변경할 수 없습니다.',
        ErrorCodes.CANNOT_CHANGE_INNING_AFTER_7TH_INNING,
        HttpStatus.BAD_REQUEST,
      );
    }

    console.log('Debug - changeInning called with gameId:', gameId);
    this.advanceInning(gameStat);
    console.log('Debug - advanceInning completed:', {
      gameStat: {
        inning: gameStat.inning,
        inningHalf: gameStat.inningHalf,
        onFirstGpId: gameStat.onFirstGpId,
        onSecondGpId: gameStat.onSecondGpId,
        onThirdGpId: gameStat.onThirdGpId,
      },
    });
    await em.save(gameStat);

    // 새로운 이닝의 GameInningStat 생성
    const newInningStat = em.create(GameInningStat, {
      game: { id: gameId },
      gameId: gameId,
      inning: gameStat.inning,
      inningHalf: gameStat.inningHalf,
      runs: 0,
      outs: 0,
      errorFlag: false,
    });
    await em.save(newInningStat);
    console.log('Debug - new GameInningStat created:', {
      inning: newInningStat.inning,
      inningHalf: newInningStat.inningHalf,
    });

    console.log('Debug - advanceInning saved successfully');
  }

  async getScoreboard(gameId: number): Promise<ScoreboardResponseDto> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: [
        'inningStats',
        'gameStat',
        'homeTeam',
        'awayTeam',
        'homeTeam.team',
        'awayTeam.team',
      ],
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
        id: game.homeTeam.team.id,
        name: game.homeTeam.team.name,
        runs: game.gameStat.homeScore,
        hits: game.gameStat.homeHits,
      },
      away: {
        id: game.awayTeam.team.id,
        name: game.awayTeam.team.name,
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

    // ✅ 주자판 비우기 추가
    gameStat.onFirstGpId = null;
    gameStat.onSecondGpId = null;
    gameStat.onThirdGpId = null;
  }
}
