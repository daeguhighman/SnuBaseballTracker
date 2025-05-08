import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { BatterStat } from './entities/batter-stat.entity';
import { PitcherStat } from './entities/pitcher-stat.entity';
import {
  BatterRecord,
  BatterRecordsResponse,
  PitcherRecord,
  PitcherRecordsResponse,
} from './dtos/player-record.dto';
import { plainToInstance } from 'class-transformer';
import { Game } from '@/games/entities/game.entity';
import { GameStatus } from '@/common/enums/game-status.enum';
const DEFAULT_PITCHER_LIMIT = 20;

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(BatterStat)
    private batterStatsRepository: Repository<BatterStat>,
    @InjectRepository(PitcherStat)
    private pitcherStatsRepository: Repository<PitcherStat>,
  ) {}

  /** 안타가 1개 이상인 모든 타자 기록을 조회 */
  async getBatterRecords(): Promise<BatterRecordsResponse> {
    const raw = await this.batterStatsRepository
      .createQueryBuilder('stat')
      .innerJoin('stat.playerTournament', 'pt')
      .innerJoin('pt.player', 'player')
      .innerJoin('player.team', 'team')
      .innerJoin('team.teamTournaments', 'tt')
      .where('stat.hits > 0')
      .orderBy('stat.hits', 'DESC')
      .select(['player.name AS "playerName"', 'team.name   AS "teamName"'])
      // subquery 로 isForfeit = false 인 게임만 COUNT
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(*)')
          .from(Game, 'g')
          .where('g.tournamentId = tt.tournamentId')
          .andWhere('(g.homeTeamId = team.id OR g.awayTeamId = team.id)')
          .andWhere('g.status = :status', { status: GameStatus.FINALIZED })
          .andWhere('g.isForfeit = false');
      }, 'teamGameCount')
      .addSelect([
        'stat.plateAppearances AS "PA"',
        'stat.atBats           AS "AB"',
        'stat.hits             AS "H"',
        'stat.doubles          AS "2B"',
        'stat.triples          AS "3B"',
        'stat.homeRuns         AS "HR"',
        'stat.walks            AS "BB"',
        'stat.battingAverage   AS "AVG"',
        'stat.onBasePercentage AS "OBP"',
        'stat.sluggingPercentage AS "SLG"',
        'stat.ops              AS "OPS"',
      ])
      .getRawMany();

    return {
      count: raw.length,
      batters: plainToInstance(BatterRecord, raw),
    };
  }

  /** 상위 N명의 투수 기록을 조회 */
  async getPitcherRecords(
    limit = DEFAULT_PITCHER_LIMIT,
  ): Promise<PitcherRecordsResponse> {
    const raw = await this.pitcherStatsRepository
      .createQueryBuilder('stat')
      .innerJoin('stat.playerTournament', 'pt')
      .innerJoin('pt.player', 'player')
      .innerJoin('player.team', 'team')
      .where('stat.strikeouts > 0')
      .orderBy('stat.strikeouts', 'DESC')
      .limit(limit)
      .select([
        'player.name AS "playerName"',
        'team.name   AS "teamName"',
        'stat.strikeouts AS "K"',
      ])
      .getRawMany();

    return {
      count: raw.length,
      pitchers: plainToInstance(PitcherRecord, raw),
    };
  }
}
