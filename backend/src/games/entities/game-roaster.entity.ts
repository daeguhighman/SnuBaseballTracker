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
import { PlayerTournament } from '@/players/entities/player-tournament.entity';
import { TeamTournament } from '@/teams/entities/team-tournament.entity';

@Entity('game_roasters')
@Unique(['game', 'teamTournament', 'playerTournament'])
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
  @ManyToOne(() => TeamTournament, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'team_tournament_id' })
  teamTournament: TeamTournament;
  @Column({ name: 'team_tournament_id' })
  teamTournamentId: number;

  @Index()
  @ManyToOne(() => PlayerTournament, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'player_tournament_id' })
  playerTournament: PlayerTournament;
  @Column({ name: 'player_tournament_id' })
  playerTournamentId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
