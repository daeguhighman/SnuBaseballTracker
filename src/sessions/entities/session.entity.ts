import { User } from '@/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, { cascade: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'text' })
  tokenHash: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;
}
