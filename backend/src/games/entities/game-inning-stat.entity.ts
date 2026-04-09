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

@Entity('game_inning_stats')
export class GameInningStat {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @ManyToOne(() => Game, (game) => game.inningStats, {
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

  @Column({ type: 'int', nullable: true, name: 'start_seq' })
  startSeq: number | null;

  @Column({ type: 'int', nullable: true, name: 'end_seq' })
  endSeq: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
