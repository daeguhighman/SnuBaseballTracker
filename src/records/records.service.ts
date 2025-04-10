import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatterStats } from './entities/batter-stats.entity';
import { PitcherStats } from './entities/pitcher-stats.entity';
import {
  BatterRecord,
  BatterRecordsResponse,
  PitcherRecord,
  PitcherRecordsResponse,
} from './dtos/player-record.dto';

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(BatterStats)
    private batterStatsRepository: Repository<BatterStats>,
    @InjectRepository(PitcherStats)
    private pitcherStatsRepository: Repository<PitcherStats>,
  ) {}

  async getBatterRecords(limit: number): Promise<BatterRecordsResponse> {
    const batterStats = await this.batterStatsRepository.find({
      order: {
        hits: 'DESC',
      },
      take: limit,
      relations: ['player', 'player.team'],
    });

    const batterRecords: BatterRecord[] = batterStats.map((batterStat) => ({
      playerName: batterStat.player.name,
      teamName: batterStat.player.team.name,
      AB: batterStat.atBats,
      H: batterStat.hits,
      '2B': batterStat.doubles,
      '3B': batterStat.triples,
      HR: batterStat.homeRuns,
      BB: batterStat.walks,
      AVG: batterStat.battingAverage,
      OBP: batterStat.onBasePercentage,
      SLG: batterStat.sluggingPercentage,
      OPS: batterStat.ops,
    }));

    return {
      count: batterRecords.length,
      batters: batterRecords,
    };
  }

  async getPitcherRecords(limit: number): Promise<PitcherRecordsResponse> {
    const pitcherStats = await this.pitcherStatsRepository.find({
      order: {
        strikeouts: 'DESC',
      },
      take: limit,
      relations: ['player', 'player.team'],
    });

    const pitcherRecords: PitcherRecord[] = pitcherStats.map((pitcherStat) => ({
      playerName: pitcherStat.player.name,
      teamName: pitcherStat.player.team.name,
      K: pitcherStat.strikeouts,
    }));

    return {
      count: pitcherRecords.length,
      pitchers: pitcherRecords,
    };
  }
}
