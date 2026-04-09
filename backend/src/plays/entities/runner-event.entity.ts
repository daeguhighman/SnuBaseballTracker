/* src/games/entities/runner-event.entity.ts */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Game } from '@/games/entities/game.entity';
import { Play } from '@/plays/entities/play.entity';
import { BatterGameParticipation } from '@/games/entities/batter-game-participation.entity';
import { lastDayOfDecade } from 'date-fns';
import { PitcherGameParticipation } from '@/games/entities/pitcher-game-participation.entity';

/** 베이스 위치 */
export type BasePos = 'B' | '1' | '2' | '3' | 'H' | 'O';

@Entity('runner_events')
// @Index('idx_runner_game_play', ['game_id', 'play_id'])
export class RunnerEvent {
  /* ---------- PK ---------- */
  @PrimaryGeneratedColumn()
  id: number;

  /* ---------- 관계 FK ---------- */
  /** 경기(쿼리 범위·정합 체크용) */
  @Column({ name: 'game_id' })
  gameId: number;

  @ManyToOne(() => Game, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game: Game;

  /** 속한 타석 */
  @Column({ name: 'play_id' })
  playId: number;

  @ManyToOne(() => Play, (p) => p.runnerEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'play_id' })
  play: Play;

  /** 이동한 주자의 ‘출전 슬롯’ */
  @Column({ name: 'runner_gp_id' })
  runnerGpId: number;

  @ManyToOne(() => BatterGameParticipation, { eager: false })
  @JoinColumn({ name: 'runner_gp_id' })
  runnerGp: BatterGameParticipation;

  /** 득점하면 타점을 주는 타자(출전 슬롯) – NULL 가능 */
  @Column({ nullable: true, name: 'rbi_batter_gp_id' })
  rbiBatterGpId?: number;

  @ManyToOne(() => BatterGameParticipation, { eager: false, nullable: true })
  @JoinColumn({ name: 'rbi_batter_gp_id' })
  rbiBatterGp?: BatterGameParticipation;

  @Column({ name: 'start_base', type: 'char', length: 1 })
  startBase: BasePos; // B,1,2,3,H 중 하나

  @Column({ name: 'end_base', type: 'char', length: 1 })
  endBase: BasePos; // 1,2,3,H,O 중 하나

  /* ---------- Earned-Run 계산 구분 ---------- */
  /** 실제 플레이 여부 (true = 경기에서 벌어진 이동) */
  @Column({ name: 'is_actual', type: 'bool', default: true })
  isActual: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
