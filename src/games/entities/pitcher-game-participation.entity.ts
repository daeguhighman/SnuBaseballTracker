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

@Entity('pitcher_game_participations')
export class PitcherGameParticipation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Game, (game) => game.pitcherGameParticipations)
  game: Game;

  @ManyToOne(() => Player)
  player: Player;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
