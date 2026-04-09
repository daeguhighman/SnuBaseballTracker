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
import { BaseBatterStat } from '../../common/entities/base-batter-stat.entity';

@Entity('batter_stats')
@Unique(['playerTournament'])
export class BatterStat extends BaseBatterStat {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @OneToOne(() => PlayerTournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_tournament_id' })
  playerTournament: PlayerTournament;
  @Column({ name: 'player_tournament_id' })
  playerTournamentId: number;

  @Column({ default: 0, name: 'runs' })
  runs: number;

  @Column({ default: 0, name: 'runs_batted_in' })
  runsBattedIn: number;

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
