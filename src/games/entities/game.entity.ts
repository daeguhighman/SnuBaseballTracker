import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Team } from '@teams/entities/team.entity';
import { Tournament } from '@/tournaments/tournament.entity';
import { GameInningScore } from './game-inning-score.entity';
import { BatterGameStats } from './batter-game-stats.entity';
import { PitcherGameStats } from './pitcher-game-stats.entity';
import { BatterGameParticipation } from './batter-game-participation.entity';
import { PitcherGameParticipation } from './pitcher-game-participation.entity';
import { GameStat } from './game-stat.entity';

export enum GameStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  EDITING = 'EDITING',
  CANCELLED = 'CANCELLED',
  FINALIZED = 'FINALIZED',
}

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tournament)
  tournament: Tournament;

  @ManyToOne(() => Team)
  homeTeam: Team;

  @ManyToOne(() => Team)
  awayTeam: Team;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.SCHEDULED,
  })
  status: GameStatus;

  @OneToMany(() => GameInningScore, (inningScore) => inningScore.game)
  inningScores: GameInningScore[];

  @OneToMany(() => BatterGameStats, (stats) => stats.game)
  batterGameStats: BatterGameStats[];

  @OneToMany(() => PitcherGameStats, (stats) => stats.game)
  pitcherGameStats: PitcherGameStats[];

  @OneToMany(
    () => BatterGameParticipation,
    (participation) => participation.game,
  )
  batterGameParticipations: BatterGameParticipation[];

  @OneToMany(
    () => PitcherGameParticipation,
    (participation) => participation.game,
  )
  pitcherGameParticipations: PitcherGameParticipation[];

  @OneToMany(() => GameStat, (stat) => stat.game)
  gameStats: GameStat[];
}
