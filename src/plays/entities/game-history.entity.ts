import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Game } from '@/games/entities/game.entity';

/** 히스토리 액션 타입 */
export enum HistoryActionType {
  CREATE_PLAY = 'CREATE_PLAY',
  UPDATE_PLAY_RESULT = 'UPDATE_PLAY_RESULT',
  ADD_RUNNER_EVENTS = 'ADD_RUNNER_EVENTS',
  DELETE_RUNNER_EVENTS = 'DELETE_RUNNER_EVENTS',
}

/** 히스토리 상태 */
export enum HistoryStatus {
  ACTIVE = 'ACTIVE', // 현재 활성 상태
  UNDONE = 'UNDONE', // undo된 상태
  REDONE = 'REDONE', // redo된 상태
  INVALID = 'INVALID', // 무효화된 상태 (새로운 액션으로 인해)
}

@Entity('game_histories')
@Index('idx_game_history_game_seq', ['game_id', 'seq'])
export class GameHistory {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  gameId: number;

  @ManyToOne(() => Game, (game) => game.gameHistories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game: Game;

  /** 게임 내 히스토리 순서 */
  @Column({ type: 'int' })
  seq: number;

  /** 액션 타입 */
  @Column({ type: 'enum', enum: HistoryActionType })
  actionType: HistoryActionType;

  /** 관련된 play ID */
  @Column({ nullable: true })
  playId?: number;

  /** 액션 데이터 (JSON) */
  @Column({ type: 'json', nullable: true })
  actionData?: any;

  /** 이전 상태 데이터 (JSON) */
  @Column({ type: 'json', nullable: true })
  previousState?: any;

  /** 현재 상태 */
  @Column({ type: 'enum', enum: HistoryStatus, default: HistoryStatus.ACTIVE })
  status: HistoryStatus;

  @CreateDateColumn()
  createdAt: Date;
}
