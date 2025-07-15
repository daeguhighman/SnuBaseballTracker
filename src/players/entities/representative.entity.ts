import { TeamTournament } from '@/teams/entities/team-tournament.entity';
import { User } from '@/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Column,
} from 'typeorm';

@Entity('representative')
export class Representative {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @OneToOne(() => TeamTournament, (tt) => tt.representative)
  @JoinColumn({ name: 'team_tournament_id' })
  teamTournament: TeamTournament;

  @Column({ name: 'team_tournament_id' })
  teamTournamentId: number;
}
