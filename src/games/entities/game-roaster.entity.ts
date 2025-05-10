import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  Unique,
  Column,
} from 'typeorm';
import { Game } from './game.entity';
import { Team } from '@teams/entities/team.entity';
import { Player } from '@players/entities/player.entity';

@Entity('game_roasters')
@Unique(['game', 'team', 'player'])
export class GameRoaster {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @ManyToOne(() => Game, (g) => g.gameRoasters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game: Game;
  @Column({ name: 'game_id' })
  gameId: number;

  @Index()
  @ManyToOne(() => Team, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'team_id' })
  team: Team;
  @Column({ name: 'team_id' })
  teamId: number;

  @Index()
  @ManyToOne(() => Player, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'player_id' })
  player: Player;
  @Column({ name: 'player_id' })
  playerId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
