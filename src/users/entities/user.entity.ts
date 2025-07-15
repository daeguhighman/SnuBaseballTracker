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
import { PlayerEntry } from '@/tournaments/entities/player-entry.entity';
import { UmpireEntry } from '@/tournaments/entities/umpire-entry.entity';
import { UserProfile } from '@/profile/entities/user-profile.entity';

export enum AppRole {
  ADMIN = 'ADMIN',
  NORMAL = 'NORMAL',
}

@Entity('users')
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AppRole })
  role: AppRole;

  @Column({ length: 150 })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  // @Column({ default: 0 }) // refresh 토큰 일괄 폐기를 위한 전역 버전
  // tokenVersion: number;

  @OneToMany(() => PlayerEntry, (pe) => pe.claimUser)
  playerEntries: PlayerEntry[];

  @OneToMany(() => UmpireEntry, (ue) => ue.user)
  umpireEntries: UmpireEntry[];

  @OneToOne(() => UserProfile, (up) => up.user)
  profile: UserProfile;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
