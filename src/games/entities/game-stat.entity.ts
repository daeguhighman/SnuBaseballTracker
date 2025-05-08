import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { PitcherGameParticipation } from './pitcher-game-participation.entity';
import { BatterGameParticipation } from './batter-game-participation.entity';
import { InningHalf } from '@common/enums/inning-half.enum';
@Entity('game_stats')
export class GameStat {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @OneToOne(() => Game, (game) => game.gameStat, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'game_id' })
  game: Game;
  @Column({ name: 'game_id' })
  gameId: number;

  @Column({ name: 'home_score', default: 0 })
  homeScore: number;

  @Column({ name: 'away_score', default: 0 })
  awayScore: number;

  @Column({ name: 'home_hits', default: 0 })
  homeHits: number;

  @Column({ name: 'away_hits', default: 0 })
  awayHits: number;

  @Column({ name: 'inning', default: 1 })
  inning: number;

  @Column({ type: 'enum', enum: InningHalf, default: InningHalf.TOP })
  inningHalf: InningHalf;

  @OneToOne(() => PitcherGameParticipation)
  @JoinColumn({ name: 'home_pitcher_participation_id' })
  homePitcherParticipation: PitcherGameParticipation;
  @Column({ name: 'home_pitcher_participation_id' })
  homePitcherParticipationId: number;

  @OneToOne(() => BatterGameParticipation)
  @JoinColumn({ name: 'home_batter_participation_id' })
  homeBatterParticipation: BatterGameParticipation;
  @Column({ name: 'home_batter_participation_id' })
  homeBatterParticipationId: number;

  @OneToOne(() => PitcherGameParticipation)
  @JoinColumn({ name: 'away_pitcher_participation_id' })
  awayPitcherParticipation: PitcherGameParticipation;
  @Column({ name: 'away_pitcher_participation_id' })
  awayPitcherParticipationId: number;

  @OneToOne(() => BatterGameParticipation)
  @JoinColumn({ name: 'away_batter_participation_id' })
  awayBatterParticipation: BatterGameParticipation;
  @Column({ name: 'away_batter_participation_id' })
  awayBatterParticipationId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
