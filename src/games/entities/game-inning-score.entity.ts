import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Game } from './game.entity';

export enum InningHalf {
  TOP = 'TOP',
  BOT = 'BOT',
}

@Entity('game_inning_scores')
export class GameInningScore {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Game, (game) => game.inningScores)
  game: Game;

  @Column()
  inning: number;

  @Column({
    type: 'enum',
    enum: InningHalf,
  })
  inningHalf: InningHalf;

  @Column()
  score: number;
}
