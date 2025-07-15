import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Game } from './game.entity';
import { Team } from '@teams/entities/team.entity';
import { Player } from '@players/entities/player.entity';
import { PitcherGameStat } from './pitcher-game-stat.entity';
import { Play } from '@/plays/entities/play.entity';

@Entity('pitcher_game_participations')
// @Unique(['game', 'player'])
export class PitcherGameParticipation {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @ManyToOne(() => Game, (game) => game.pitcherGameParticipations, {})
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

  @Column({ name: 'substitution_order', default: 0 })
  substitutionOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToOne(() => PitcherGameStat, (stat) => stat.pitcherGameParticipation, {
    cascade: ['insert', 'update'],
  })
  pitcherGameStat?: PitcherGameStat;

  @OneToMany(() => Play, (p) => p.pitcher, { cascade: true })
  gamePlays: Play[];

  @Column({ name: 'enter_sequence', nullable: true })
  enterSequence?: number;

  @Column({ name: 'exit_sequence', nullable: true })
  exitSequence?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
