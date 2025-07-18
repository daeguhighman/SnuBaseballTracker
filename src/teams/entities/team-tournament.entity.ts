import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Unique,
  Index,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Team } from './team.entity';
import { Tournament } from '@tournaments/entities/tournament.entity';
import { Player } from '@/players/entities/player.entity';
import { PlayerTournament } from '@/players/entities/player-tournament.entity';
import { User } from '@/users/entities/user.entity';

@Entity('team_tournaments')
@Unique(['team', 'tournament'])
export class TeamTournament {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @ManyToOne(() => Team, (team) => team.teamTournaments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'team_id' })
  team: Team;
  @Column({ name: 'team_id' })
  teamId: number;

  @Index()
  @ManyToOne(() => Tournament, (tournament) => tournament.teamTournaments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;
  @Column({ name: 'tournament_id' })
  tournamentId: number;

  @OneToMany(() => PlayerTournament, (pt) => pt.teamTournament)
  playerTournaments: PlayerTournament[];

  @Index()
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'representative_user_id' })
  representativeUser?: User;

  @Column({ name: 'representative_user_id', nullable: true })
  representativeUserId?: string;
  @Column({ name: 'group_name', length: 50 })
  groupName: string;

  @Column({ default: 0 })
  games: number;

  @Column({ default: 0 })
  wins: number;

  @Column({ default: 0 })
  draws: number;

  @Column({ default: 0 })
  losses: number;

  @Column({ name: 'runs_scored', default: 0 })
  runsScored: number;

  @Column({ name: 'runs_allowed', default: 0 })
  runsAllowed: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
