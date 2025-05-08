import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { Team } from '@teams/entities/team.entity';
import { Player } from '@players/entities/player.entity';
import { BatterGameStat } from './batter-game-stat.entity';
import { Position } from '@common/enums/position.enum';

@Entity('batter_game_participations')
@Unique(['game', 'player'])
export class BatterGameParticipation {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @ManyToOne(() => Game, (game) => game.batterGameParticipations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'game_id' })
  game: Game;
  @Column({ name: 'game_id' })
  gameId: number;

  @Index()
  @ManyToOne(() => Team, (t) => t.players, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'team_id' })
  team: Team;
  @Column({ name: 'team_id' })
  teamId: number;

  @Index()
  @ManyToOne(() => Player, (p) => p.playerTournaments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'player_id' })
  player: Player;
  @Column({ name: 'player_id' })
  playerId: number;

  @Column({
    type: 'enum',
    enum: Position,
    nullable: false,
  })
  position: Position;

  @Column({ name: 'batting_order', type: 'int' })
  battingOrder: number;

  @Column({ name: 'substitution_order', type: 'int', default: 0 })
  substitutionOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToOne(() => BatterGameStat, (stat) => stat.batterGameParticipation, {
    cascade: ['insert', 'update'],
  })
  batterGameStat?: BatterGameStat;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
