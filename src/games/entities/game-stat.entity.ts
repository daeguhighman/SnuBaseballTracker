import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Game } from './game.entity';

@Entity('game_stats')
export class GameStat {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Game, (game) => game.gameStats)
  game: Game;

  @Column()
  home_score: number;

  @Column()
  away_score: number;

  @Column()
  home_hits: number;

  @Column()
  away_hits: number;

  @Column()
  current_inning: number;

  @Column()
  current_inning_half: string;
}
