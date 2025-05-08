import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  RelationId,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { PlayerTournament } from '@players/entities/player-tournament.entity';

@Entity('batter_stats')
@Unique(['playerTournament'])
export class BatterStat {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @OneToOne(() => PlayerTournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_tournament_id' })
  playerTournament: PlayerTournament;
  @Column({ name: 'player_tournament_id' })
  playerTournamentId: number;

  @Column({ name: 'plate_appearances', default: 0 })
  plateAppearances: number;

  @Column({ name: 'at_bats', default: 0 })
  atBats: number;

  @Column({ default: 0 })
  hits: number;

  @Column({ default: 0 })
  singles: number;

  @Column({ default: 0 })
  doubles: number;

  @Column({ default: 0 })
  triples: number;

  @Column({ name: 'home_runs', default: 0 })
  homeRuns: number;

  @Column({ default: 0 })
  walks: number;

  @Column({ name: 'sacrifice_flies', default: 0 })
  sacrificeFlies: number;

  @Column({ default: 0 })
  etcs: number;

  @Column({
    name: 'batting_average',
    type: 'decimal',
    precision: 4,
    scale: 3,
    default: 0,
  })
  battingAverage: number;

  @Column({
    name: 'on_base_percentage',
    type: 'decimal',
    precision: 4,
    scale: 3,
    default: 0,
  })
  onBasePercentage: number;

  @Column({
    name: 'slugging_percentage',
    type: 'decimal',
    precision: 4,
    scale: 3,
    default: 0,
  })
  sluggingPercentage: number;

  @Column({
    name: 'ops',
    type: 'decimal',
    precision: 4,
    scale: 3,
    default: 0,
  })
  ops: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
