import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  RelationId,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { BatterGameParticipation } from './batter-game-participation.entity';

@Entity('batter_game_stats')
@Unique(['batterGameParticipation'])
export class BatterGameStat {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @OneToOne(() => BatterGameParticipation, (part) => part.batterGameStat, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'batter_game_participation_id' })
  batterGameParticipation: BatterGameParticipation;
  @Column({ name: 'batter_game_participation_id' })
  batterGameParticipationId: number;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
