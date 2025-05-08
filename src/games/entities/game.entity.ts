import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Tournament } from '@tournaments/entities/tournament.entity';
import { Team } from '@teams/entities/team.entity';
import { Umpire } from '@umpires/entities/umpire.entity';
import { GameInningStat } from './game-inning-stat.entity';
import { BatterGameParticipation } from './batter-game-participation.entity';
import { PitcherGameParticipation } from './pitcher-game-participation.entity';
import { GameStat } from './game-stat.entity';
import { GameStatus } from '@common/enums/game-status.enum';
import { GameRoaster } from './game-roaster.entity';
import { MatchStage } from '@common/enums/match-stage.enum';
@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @Column({ name: 'tournament_id' })
  tournamentId: number;
  @ManyToOne(() => Tournament, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Index()
  @Column({ name: 'home_team_id' })
  homeTeamId: number;
  @ManyToOne(() => Team, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'home_team_id' })
  homeTeam: Team;

  @Index()
  @Column({ name: 'away_team_id' })
  awayTeamId: number;
  @ManyToOne(() => Team, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'away_team_id' })
  awayTeam: Team;

  @Column({ name: 'winner_team_id', nullable: true })
  winnerTeamId: number;
  @ManyToOne(() => Team, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'winner_team_id' })
  winnerTeam: Team;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({
    name: 'status',
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.SCHEDULED,
  })
  status: GameStatus;

  @Column({ name: 'is_forfeit', default: false })
  isForfeit: boolean;
  @Column({ name: 'record_umpire_id', nullable: true })
  recordUmpireId: number;
  @ManyToOne(() => Umpire, { nullable: true, onDelete: 'SET NULL' }) // 상대방이 삭제될 때
  @JoinColumn({ name: 'record_umpire_id' })
  recordUmpire: Umpire;

  @OneToMany(() => GameInningStat, (i) => i.game, {
    cascade: ['insert', 'update'],
  })
  inningStats: GameInningStat[];

  @OneToMany(() => BatterGameParticipation, (b) => b.game, {
    cascade: ['insert', 'update'],
  })
  batterGameParticipations: BatterGameParticipation[];

  @OneToMany(() => PitcherGameParticipation, (p) => p.game, {
    cascade: ['insert', 'update'],
  })
  pitcherGameParticipations: PitcherGameParticipation[];

  @OneToMany(() => GameRoaster, (r) => r.game, {
    cascade: ['insert', 'update'],
  })
  gameRoasters: GameRoaster[];

  @OneToOne(() => GameStat, (stat) => stat.game, {
    cascade: ['insert', 'update', 'soft-remove'],
    nullable: true,
  })
  gameStat?: GameStat;

  @Column({
    type: 'enum',
    enum: MatchStage,
    default: MatchStage.LEAGUE,
  })
  stage: MatchStage;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
