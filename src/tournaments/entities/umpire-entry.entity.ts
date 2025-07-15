import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tournament } from './tournament.entity';
import { User } from '@/users/entities/user.entity';

@Entity('umpire_entries')
export class UmpireEntry {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Tournament)
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Column()
  name: string;

  @Column()
  email: string;

  @ManyToOne(() => User, (u) => u.umpireEntries, { nullable: true })
  @JoinColumn()
  user?: User;
}
