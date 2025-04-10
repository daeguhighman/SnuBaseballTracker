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

@Entity('batter_game_stats')
export class BatterGameStats {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Game, (game) => game.batterGameStats)
  game: Game;

  @ManyToOne(() => Player)
  player: Player;

  @Column({ name: 'plate_appearances', default: 0 })
  plateAppearances: number;

  @Column({ name: 'hits', default: 0 })
  hits: number;

  @Column({ name: 'doubles', default: 0 })
  doubles: number;

  @Column({ name: 'triples', default: 0 })
  triples: number;

  @Column({ name: 'home_runs', default: 0 })
  homeRuns: number;

  @Column({ name: 'walks', default: 0 })
  walks: number;
}
