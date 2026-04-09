import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Unique,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserProfile } from '@/profiles/entities/profile.entity';
import { UmpireTournament } from '@/umpires/entities/umpire-tournament.entity';
import { PlayerTournament } from '@/players/entities/player-tournament.entity';
import { TeamTournament } from '@/teams/entities/team-tournament.entity';
import { Player } from '@/players/entities/player.entity';

export enum AppRole {
  ADMIN = 'ADMIN',
  NORMAL = 'NORMAL',
}

@Entity('users')
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'enum', enum: AppRole, default: AppRole.NORMAL })
  role: AppRole;

  @Column({ length: 150 })
  email: string;

  @Column({ length: 150 })
  nickname: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash: string;

  @OneToMany(() => UmpireTournament, (ut) => ut.umpire)
  umpireClaims: UmpireTournament[];

  @OneToMany(() => PlayerTournament, (pt) => pt.claimUser)
  playerClaims: PlayerTournament[];

  @OneToMany(() => TeamTournament, (tt) => tt.representativeUser)
  teamTournaments: TeamTournament[];

  @OneToOne(() => UserProfile, (up) => up.user)
  profile: UserProfile;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
