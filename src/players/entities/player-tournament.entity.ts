import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Relation,
  JoinColumn,
  Column,
  Unique,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  RelationId,
  OneToMany,
} from 'typeorm';

import { Player } from '@/players/entities/player.entity';
import { TeamTournament } from '@/teams/entities/team-tournament.entity';
import { Tournament } from '@/tournaments/entities/tournament.entity';

import { User } from '@/users/entities/user.entity';
import { BatterGameParticipation } from '@/games/entities/batter-game-participation.entity';
import { PitcherGameParticipation } from '@/games/entities/pitcher-game-participation.entity';

@Entity('player_tournaments')
@Unique(['player', 'teamTournament']) // ① 한 팀‑대회에 중복 등록 금지
export class PlayerTournament {
  /* ───────── 기본 PK ───────── */
  @PrimaryGeneratedColumn('increment')
  id: number;

  /* ───────── 선수 ───────── */
  @Index()
  @ManyToOne(() => Player, (p) => p.playerTournaments, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'player_id' })
  player: Relation<Player>;

  @Column({ name: 'player_id' })
  playerId: number;

  @Column({ name: 'back_number', nullable: true })
  backNumber?: number;

  /* ───────── 팀‑대회 ───────── */
  @ManyToOne(() => TeamTournament, (tt) => tt.playerTournaments, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'team_tournament_id' })
  teamTournament: Relation<TeamTournament>;

  @Column({ name: 'team_tournament_id' })
  teamTournamentId: number;

  /* 대회 ID만 편의상 가져다 쓰기 (FK 생성 X) */
  @Column({ name: 'tournament_id' })
  tournamentId: number;

  /* ───────── 대회용 개별 정보 ───────── */

  @Column({ name: 'is_wildcard', default: false })
  isWildcard?: boolean;

  @Column({ name: 'is_elite', default: false })
  isElite?: boolean;

  @OneToMany(() => BatterGameParticipation, (batter) => batter.playerTournament)
  batterGameParticipations: BatterGameParticipation[];

  @OneToMany(
    () => PitcherGameParticipation,
    (pitcher) => pitcher.playerTournament,
  )
  pitcherGameParticipations: PitcherGameParticipation[];

  /* ───────── 사용자 클레임 ───────── */
  @ManyToOne(() => User, (u) => u.playerClaims, { nullable: true })
  @JoinColumn({ name: 'claim_user_id' })
  claimUser?: Relation<User>;

  @Column({ name: 'claim_user_id', nullable: true })
  claimUserId?: string;

  /* ───────── 타임스탬프 ───────── */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
