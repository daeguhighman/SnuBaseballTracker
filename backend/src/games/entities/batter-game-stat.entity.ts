import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { BatterGameParticipation } from './batter-game-participation.entity';
import { BaseBatterStat } from '../../common/entities/base-batter-stat.entity';

@Entity('batter_game_stats')
@Unique(['batterGameParticipation'])
export class BatterGameStat extends BaseBatterStat {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @OneToOne(() => BatterGameParticipation, (part) => part.batterGameStat, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'batter_game_participation_id' })
  batterGameParticipation: BatterGameParticipation;
  @Column({ name: 'batter_game_participation_id' })
  batterGameParticipationId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
