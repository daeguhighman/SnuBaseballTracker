import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlayerTournament } from '@/players/entities/player-tournament';
@Entity('batter_stats')
export class BatterStats {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PlayerTournament)
  @JoinColumn({ name: 'player_tournament_id' })
  playerTournament: PlayerTournament;

  @Column({ name: 'plate_appearances' })
  plateAppearances: number;

  @Column({ name: 'at_bats' })
  atBats: number;

  @Column()
  hits: number;

  @Column()
  doubles: number;

  @Column()
  triples: number;

  @Column({ name: 'home_runs' })
  homeRuns: number;

  @Column()
  walks: number;

  @Column({ name: 'batting_average', type: 'decimal', precision: 4, scale: 3 })
  battingAverage: number;

  @Column({
    name: 'on_base_percentage',
    type: 'decimal',
    precision: 4,
    scale: 3,
  })
  onBasePercentage: number;

  @Column({
    name: 'slugging_percentage',
    type: 'decimal',
    precision: 4,
    scale: 3,
  })
  sluggingPercentage: number;

  @Column({ type: 'decimal', precision: 4, scale: 3 })
  ops: number;
}
