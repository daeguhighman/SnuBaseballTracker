import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Player } from './player.entity';
import { Tournament } from '@/tournaments/tournament.entity';

@Entity('player_tournaments')
export class PlayerTournament {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Player, (player) => player.playerTournaments)
  player: Player;

  @ManyToOne(() => Tournament, (tournament) => tournament.playerTournaments)
  tournament: Tournament;
}
