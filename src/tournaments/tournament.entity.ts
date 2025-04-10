import { PlayerTournament } from '@/players/entities/player-tournament';
import { TeamTournament } from '@/teams/entities/team-tournament.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

export enum TournamentSeason {
  SPRING = 'spring',
  FALL = 'fall',
}

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'year' })
  year: number;

  @Column({
    name: 'season',
    type: 'enum',
    enum: TournamentSeason,
  })
  season: TournamentSeason;

  @OneToMany(
    () => TeamTournament,
    (teamTournament) => teamTournament.tournament,
  )
  teamTournaments: TeamTournament[];

  @OneToMany(
    () => PlayerTournament,
    (playerTournament) => playerTournament.tournament,
  )
  playerTournaments: PlayerTournament[];
}
