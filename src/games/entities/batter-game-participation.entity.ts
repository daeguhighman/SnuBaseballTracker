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

export enum Position {
  P = 'P',
  C = 'C',
  '1B' = '1B',
  '2B' = '2B',
  '3B' = '3B',
  SS = 'SS',
  LF = 'LF',
  CF = 'CF',
  RF = 'RF',
  DH = 'DH',
}

@Entity('batter_game_participations')
export class BatterGameParticipation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Game, (game) => game.batterGameParticipations)
  game: Game;

  @ManyToOne(() => Player)
  player: Player;

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: Position,
  })
  position: Position;

  @Column({ nullable: true })
  order: number;
}
