import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { InningHalf } from '@/common/enums/inning-half.enum';

@Entity('virtual_inning_stats')
export class VirtualInningStat {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @ManyToOne(() => Game, (game) => game.virtualInningStats, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'game_id' })
  game: Game;
  @Column({ name: 'game_id' })
  gameId: number;

  @Column({ type: 'int' })
  inning: number;

  @Column({ type: 'enum', enum: InningHalf })
  inningHalf: InningHalf;

  @Column({ type: 'int', default: 0 })
  runs: number;

  @Column({ type: 'int', default: 0 })
  outs: number;

  // 가상 주자판 상태
  @Column({ type: 'bigint', nullable: true, name: 'on_first_gp_id' })
  onFirstGpId: number | null;

  @Column({ type: 'bigint', nullable: true, name: 'on_second_gp_id' })
  onSecondGpId: number | null;

  @Column({ type: 'bigint', nullable: true, name: 'on_third_gp_id' })
  onThirdGpId: number | null;

  @Column({ type: 'int', nullable: true, name: 'original_inning_stat_id' })
  originalInningStatId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
