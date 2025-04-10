import { PlayerTournament } from '@/players/entities/player-tournament';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';

@Entity('pitcher_stats')
export class PitcherStats {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PlayerTournament)
  @JoinColumn({ name: 'player_tournament_id' })
  playerTournament: PlayerTournament;

  @Column()
  strikeouts: number;
}
