import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TeamTournament } from './team-tournament.entity';
import { Player } from '../../players/entities/player.entity';
@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => TeamTournament, (teamTournament) => teamTournament.team)
  teamTournaments: TeamTournament[];

  @OneToMany(() => Player, (player) => player.team)
  players: Player[];
}
