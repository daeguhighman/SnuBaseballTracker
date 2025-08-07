import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Game } from '@/games/entities/game.entity';
import { RunnerEvent } from '@/plays/entities/runner-event.entity';
import { BatterGameParticipation } from '@/games/entities/batter-game-participation.entity';
import { PitcherGameParticipation } from '@/games/entities/pitcher-game-participation.entity';
import { PlateAppearanceResult } from '@/common/enums/plate-appearance-result.enum';
import { GameInningStat } from '@/games/entities/game-inning-stat.entity';

/** 타석(plate appearance)의 상태 */
export enum PlayStatus {
  LIVE = 'LIVE', // 아직 진행 중 (도루·폭투 등 가능)
  COMPLETE = 'COMPLETE', // 타석 결과 확정(안타·삼진·볼넷 등)
  ABANDONED = 'ABANDONED', // 타석 중단(주자 CS로 3아웃 등)
}

/** 최소 결과코드 집합 – 필요 시 더 추가 */
@Entity('plays')
// @Index('idx_plays_game_seq', ['game_id', 'seq'], { unique: true })
export class Play {
  /* ---------- PK & FK ---------- */
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'game_id' })
  gameId: number;

  @ManyToOne(() => Game, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game: Game;

  /* ---------- 타석 정보 ---------- */
  /** 경기 전체에서 증가하는 일련번호 (프런트 실시간 정렬용) */
  @Column({ type: 'int' })
  seq: number;

  @ManyToOne(() => GameInningStat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_inning_stat_id' })
  gameInningStat?: GameInningStat;

  /* 타자 */
  @Column({ name: 'batter_gp_id' })
  batterGpId: number;

  @ManyToOne(() => BatterGameParticipation, {
    eager: false,
  })
  @JoinColumn({ name: 'batter_gp_id', referencedColumnName: 'id' })
  batter: BatterGameParticipation;

  /* 투수 */
  @Column({ name: 'pitcher_gp_id' })
  pitcherGpId: number;

  @ManyToOne(() => PitcherGameParticipation, {
    eager: false,
  })
  @JoinColumn({ name: 'pitcher_gp_id', referencedColumnName: 'id' })
  pitcher: PitcherGameParticipation;

  /* ---------- 결과 & 상태 ---------- */
  /** 타석이 *끝난 뒤* 세트 – 진행 중엔 NULL */
  @Column({ type: 'char', length: 3, nullable: true, name: 'result_code' })
  resultCode: PlateAppearanceResult | null;

  /** 타석 진행 상태(LIVE/COMPLETE/ABANDONED) */
  @Column({ type: 'enum', enum: PlayStatus, default: PlayStatus.LIVE })
  status: PlayStatus;

  /* ---------- 관계 ---------- */
  /** 이 타석 동안 일어난 주자 이동(도루·안타·아웃 등) */
  @OneToMany(() => RunnerEvent, (re) => re.play, { cascade: true })
  runnerEvents: RunnerEvent[];

  /* ---------- 메타 ---------- */
  @CreateDateColumn()
  createdAt: Date;
}
