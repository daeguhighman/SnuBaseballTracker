import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Game } from '../entities/game.entity';
import { GameStat } from '../entities/game-stat.entity';
import { GameInningStat } from '../entities/game-inning-stat.entity';
import { TeamTournament } from '@/teams/entities/team-tournament.entity';
import { GameStatus } from '@common/enums/game-status.enum';
import { InningHalf } from '@common/enums/inning-half.enum';
import { BracketPosition, MatchStage } from '@common/enums/match-stage.enum';
import { BaseException } from '@/common/exceptions/base.exception';
import { ErrorCodes } from '@/common/exceptions/error-codes.enum';
import { GameCoreService } from './game-core.service';
import {
  CorrectInningRunsDto,
  CorrectTeamHitsDto,
} from '../dtos/score-correction.dto';

type Outcome = 'HOME' | 'AWAY' | 'DRAW';

const outcomeOf = (home: number, away: number): Outcome =>
  home > away ? 'HOME' : home < away ? 'AWAY' : 'DRAW';

/** 승자가 진출하는(SF는 패자도 3·4위전으로 가는) 다음 라운드 경기 */
const NEXT_POSITIONS: Partial<Record<BracketPosition, BracketPosition[]>> = {
  [BracketPosition.QF_1]: [BracketPosition.SF_1],
  [BracketPosition.QF_2]: [BracketPosition.SF_1],
  [BracketPosition.QF_3]: [BracketPosition.SF_2],
  [BracketPosition.QF_4]: [BracketPosition.SF_2],
  [BracketPosition.SF_1]: [BracketPosition.F, BracketPosition.THIRD_PLACE],
  [BracketPosition.SF_2]: [BracketPosition.F, BracketPosition.THIRD_PLACE],
};

/**
 * 종료된 경기의 점수·안타 정정.
 * 점수가 바뀌어 승패가 달라지면 순위표(리그)나 다음 라운드 대진(토너먼트)도 맞춘다.
 */
@Injectable()
export class GameCorrectionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly gameCoreService: GameCoreService,
  ) {}

  async correctInningRuns(gameId: number, dto: CorrectInningRunsDto) {
    await this.dataSource.transaction(async (manager) => {
      const game = await this.loadFinalizedGame(manager, gameId);

      const inningStat = await manager.findOne(GameInningStat, {
        where: { gameId, inning: dto.inning, inningHalf: dto.inningHalf },
      });
      if (!inningStat) {
        throw new BaseException(
          `${dto.inning}회${dto.inningHalf === InningHalf.TOP ? '초' : '말'} 기록이 없습니다.`,
          ErrorCodes.GAME_INNING_STAT_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      inningStat.runs = dto.runs;
      await manager.save(inningStat);

      // 총점은 이닝 점수의 합으로 다시 계산한다
      const sums: { inningHalf: InningHalf; runs: string }[] = await manager
        .createQueryBuilder(GameInningStat, 'i')
        .select('i.inningHalf', 'inningHalf')
        .addSelect('COALESCE(SUM(i.runs), 0)', 'runs')
        .where('i.gameId = :gameId', { gameId })
        .groupBy('i.inningHalf')
        .getRawMany();
      const total = (half: InningHalf) =>
        Number(sums.find((s) => s.inningHalf === half)?.runs ?? 0);

      const gameStat = game.gameStat;
      const before = { home: gameStat.homeScore, away: gameStat.awayScore };
      const after = { home: total(InningHalf.BOT), away: total(InningHalf.TOP) };
      await manager.update(GameStat, gameStat.id, {
        homeScore: after.home,
        awayScore: after.away,
      });

      if (game.stage === MatchStage.LEAGUE) {
        await this.applyLeagueChange(manager, game, before, after);
      } else {
        await this.applyBracketChange(manager, game, before, after);
      }
    });
    return { success: true, message: '점수를 정정했습니다.' };
  }

  async correctTeamHits(gameId: number, dto: CorrectTeamHitsDto) {
    await this.dataSource.transaction(async (manager) => {
      const game = await this.loadFinalizedGame(manager, gameId);
      await manager.update(
        GameStat,
        game.gameStat.id,
        dto.team === 'home' ? { homeHits: dto.hits } : { awayHits: dto.hits },
      );
    });
    return { success: true, message: '안타 수를 정정했습니다.' };
  }

  private async loadFinalizedGame(manager: EntityManager, gameId: number) {
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
    if (game.isForfeit) {
      throw new BaseException(
        '몰수승 경기는 점수를 정정할 수 없습니다.',
        ErrorCodes.GAME_NOT_EDITABLE,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (game.status !== GameStatus.FINALIZED || !game.gameStat) {
      throw new BaseException(
        '종료된 경기만 정정할 수 있습니다.',
        ErrorCodes.GAME_NOT_EDITABLE,
        HttpStatus.BAD_REQUEST,
      );
    }
    return game;
  }

  /** 득실점과 승·무·패를 이전 점수 기준에서 새 점수 기준으로 옮긴다 */
  private async applyLeagueChange(
    manager: EntityManager,
    game: Game,
    before: { home: number; away: number },
    after: { home: number; away: number },
  ) {
    const [home, away] = await Promise.all([
      manager.findOneByOrFail(TeamTournament, { id: game.homeTeamTournamentId }),
      manager.findOneByOrFail(TeamTournament, { id: game.awayTeamTournamentId }),
    ]);

    home.runsScored += after.home - before.home;
    home.runsAllowed += after.away - before.away;
    away.runsScored += after.away - before.away;
    away.runsAllowed += after.home - before.home;

    const apply = (outcome: Outcome, sign: 1 | -1) => {
      if (outcome === 'HOME') {
        home.wins += sign;
        away.losses += sign;
      } else if (outcome === 'AWAY') {
        away.wins += sign;
        home.losses += sign;
      } else {
        home.draws += sign;
        away.draws += sign;
      }
    };
    const oldOutcome = outcomeOf(before.home, before.away);
    const newOutcome = outcomeOf(after.home, after.away);
    if (oldOutcome !== newOutcome) {
      apply(oldOutcome, -1);
      apply(newOutcome, 1);
    }
    await manager.save(TeamTournament, [home, away]);

    await manager.update(Game, game.id, {
      winnerTeamTournamentId:
        newOutcome === 'HOME'
          ? home.id
          : newOutcome === 'AWAY'
            ? away.id
            : null,
    });
  }

  /** 승자가 바뀌면, 아직 시작 전인 다음 라운드 경기에서 두 팀 자리를 맞바꾼다 (동점이었으면 새로 배치) */
  private async applyBracketChange(
    manager: EntityManager,
    game: Game,
    before: { home: number; away: number },
    after: { home: number; away: number },
  ) {
    const newOutcome = outcomeOf(after.home, after.away);
    if (newOutcome === 'DRAW') {
      throw new BaseException(
        '토너먼트 경기는 동점으로 정정할 수 없습니다.',
        ErrorCodes.INVALID_INPUT,
        HttpStatus.BAD_REQUEST,
      );
    }
    const oldOutcome = outcomeOf(before.home, before.away);
    if (newOutcome === oldOutcome) return;

    const newWinner =
      newOutcome === 'HOME'
        ? game.homeTeamTournamentId
        : game.awayTeamTournamentId;
    const newLoser =
      newOutcome === 'HOME'
        ? game.awayTeamTournamentId
        : game.homeTeamTournamentId;

    const nextGames = await Promise.all(
      (NEXT_POSITIONS[game.bracketPosition] ?? []).map((bracketPosition) =>
        manager.findOne(Game, {
          where: { tournamentId: game.tournamentId, bracketPosition },
        }),
      ),
    );
    if (
      nextGames.some((next) => next && next.status !== GameStatus.SCHEDULED)
    ) {
      throw new BaseException(
        '다음 라운드 경기가 이미 시작돼 승패를 바꿀 수 없습니다.',
        ErrorCodes.GAME_NOT_EDITABLE,
        HttpStatus.BAD_REQUEST,
      );
    }

    await manager.update(Game, game.id, { winnerTeamTournamentId: newWinner });

    // 동점으로 끝나 아무도 진출하지 못했던 경기면 처음 진출하듯 배치한다
    if (oldOutcome === 'DRAW') {
      await this.gameCoreService.advanceBracket(
        game,
        newWinner,
        newLoser,
        manager,
      );
      return;
    }

    for (const next of nextGames) {
      if (!next) continue;
      const swap = (id: number | null) =>
        id === newLoser ? newWinner : id === newWinner ? newLoser : id;
      await manager.update(Game, next.id, {
        homeTeamTournamentId: swap(next.homeTeamTournamentId),
        awayTeamTournamentId: swap(next.awayTeamTournamentId),
      });
    }
  }
}
