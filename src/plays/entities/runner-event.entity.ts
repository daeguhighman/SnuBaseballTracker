/* src/games/entities/runner-event.entity.ts */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Game } from '@/games/entities/game.entity';
import { Play } from '@/plays/entities/play.entity';
import { BatterGameParticipation } from '@/games/entities/batter-game-participation.entity';
import { lastDayOfDecade } from 'date-fns';
import { PitcherGameParticipation } from '@/games/entities/pitcher-game-participation.entity';

/** 베이스 위치 */
export type BasePos = 'B' | '1' | '2' | '3' | 'H' | 'O';

// /** 러닝 이벤트 유형 */
// export enum RunnerEventType {
//   // ADV = 'ADV', // 일반 진루(안타·땅볼·포스 등)
//   // SB = 'SB', // Stolen Base
//   // CS = 'CS', // Caught Stealing
//   // PO = 'PO', // Pick-off
//   // WP = 'WP', // Wild Pitch 진루
//   // PB = 'PB', // Passed Ball
//   // BK = 'BK', // Balk
//   // E_RUN = 'E', // Error 로 인한 진루 / 득점
// }

// /** 가상 이벤트 태그 – Earned/Unearned 계산용 */
// export enum VirtualTag {
//   ERR_FIX = 'ERR_FIX', // “실책 없었다면” 롤백 이동
//   AFTER_ERR = 'AFTER_ERR', // 실책 이후 실제 이동 재플레이
//   SIM = 'SIM', // 전체 시뮬 결과(저장/캐시용)
// }

@Entity('runner_events')
// @Index('idx_runner_game_play', ['game_id', 'play_id'])
export class RunnerEvent {
  /* ---------- PK ---------- */
  @PrimaryGeneratedColumn()
  id: number;

  /* ---------- 관계 FK ---------- */
  /** 경기(쿼리 범위·정합 체크용) */
  @Column()
  gameId: number;

  @ManyToOne(() => Game, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game: Game;

  /** 속한 타석 */
  @Column()
  playId: number;

  @ManyToOne(() => Play, (p) => p.runnerEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'play_id' })
  play: Play;

  /** 이동한 주자의 ‘출전 슬롯’ */
  @Column()
  runnerGpId: number;

  @ManyToOne(() => BatterGameParticipation, { eager: false })
  @JoinColumn({ name: 'runner_gp_id' })
  runnerGp: BatterGameParticipation;

  /** 득점하면 타점을 주는 타자(출전 슬롯) – NULL 가능 */
  @Column({ nullable: true })
  rbiBatterGpId?: number;

  @ManyToOne(() => BatterGameParticipation, { eager: false, nullable: true })
  @JoinColumn({ name: 'rbi_batter_gp_id' })
  rbiBatterGp?: BatterGameParticipation;

  // /* ---------- 주루 정보 ---------- */
  // @Column({ type: 'enum', enum: RunnerEventType, default: RunnerEventType.ADV })
  // eventType: RunnerEventType;

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
}
