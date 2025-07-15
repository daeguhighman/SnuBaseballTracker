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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  tokenHash: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;

  // @UpdateDateColumn()
  // lastUsedAt: Date;
}
