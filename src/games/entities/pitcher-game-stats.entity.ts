import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { Player } from '@players/entities/player.entity';

@Entity('pitcher_game_stats')
export class PitcherGameStats {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Game, (game) => game.pitcherGameStats)
  game: Game;

  @ManyToOne(() => Player)
  player: Player;

  @Column({ name: 'strikeouts', default: 0 })
  strikeouts: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
