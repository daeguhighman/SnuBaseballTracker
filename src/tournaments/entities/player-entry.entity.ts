import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { TeamTournament } from '@teams/entities/team-tournament.entity';
import { User } from '@/users/entities/user.entity';

@Entity('player_entries')
export class PlayerEntry {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => TeamTournament)
  @JoinColumn({ name: 'team_tournament_id' })
  teamTournament: TeamTournament;

  @Column()
  name: string;

  @Column()
  email: string;

  @ManyToOne(() => User, (u) => u.playerEntries, { nullable: true })
  @JoinColumn()
  claimUser?: User;
}
