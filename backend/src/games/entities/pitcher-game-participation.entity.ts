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
} from 'typeorm';
import { Game } from './game.entity';
import { TeamTournament } from '@teams/entities/team-tournament.entity';
import { PitcherGameStat } from './pitcher-game-stat.entity';
import { PlayerTournament } from '@/players/entities/player-tournament.entity';
import { GameInningStat } from './game-inning-stat.entity';

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
  @ManyToOne(() => TeamTournament, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'team_tournament_id' })
  teamTournament: TeamTournament;
  @Column({ name: 'team_tournament_id' })
  teamTournamentId: number;

  @Index()
  @ManyToOne(() => PlayerTournament, (pt) => pt.pitcherGameParticipations, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'player_tournament_id' })
  playerTournament: PlayerTournament;
  @Column({ name: 'player_tournament_id' })
  playerTournamentId: number;

  @Column({ name: 'substitution_order', default: 0 })
  substitutionOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => GameInningStat, { nullable: true })
  @JoinColumn({ name: 'entry_game_inning_stat_id' })
  entryGameInningStat: GameInningStat;
  @Column({ name: 'entry_game_inning_stat_id', nullable: true })
  entryGameInningStatId: number | null;

  @OneToOne(() => PitcherGameStat, (stat) => stat.pitcherGameParticipation, {
    cascade: ['insert', 'update'],
  })
  pitcherGameStat?: PitcherGameStat;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
