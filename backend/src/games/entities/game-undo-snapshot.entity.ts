import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/** 경기 중 기록 직전 상태. 직전 기록 취소(undo)에 쓴다. */
@Entity('game_undo_snapshots')
@Index(['gameId', 'id'])
export class GameUndoSnapshot {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'game_id' })
  gameId: number;

  /** 사용자에게 보여 줄 기록 종류 (타석 결과, 주자 이동, 선수 교체) */
  @Column({ length: 50 })
  label: string;

  /** 테이블별 행 목록 (JSON) */
  @Column({ type: 'longtext' })
  data: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
