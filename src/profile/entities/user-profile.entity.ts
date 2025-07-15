import { User } from '@/users/entities/user.entity';
import { Index } from 'typeorm';
import { College } from './college.entity';
import { Department } from './department.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';

@Entity('user_profiles')
export class UserProfile {
  @Index(['studentNumber', 'college'], { unique: true })
  @PrimaryGeneratedColumn('increment')
  id: number;

  @OneToOne(() => User, (u) => u.profile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user!: Relation<User>;

  @Column({ length: 20, nullable: true }) nickname?: string;
  @Column({ nullable: true, length: 300 }) photoUrl?: string; // S3 URL or CDN Path
}
