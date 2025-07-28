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
import { PitcherGameParticipation } from './pitcher-game-participation.entity';
import { BasePitcherStat } from '../../common/entities/base-pitcher-stat.entity';

@Entity('pitcher_game_stats')
@Unique(['pitcherGameParticipation'])
export class PitcherGameStat extends BasePitcherStat {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @OneToOne(() => PitcherGameParticipation, (part) => part.pitcherGameStat, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pitcher_game_participation_id' })
  pitcherGameParticipation: PitcherGameParticipation;
  @Column({ name: 'pitcher_game_participation_id' })
  pitcherGameParticipationId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
