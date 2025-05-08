import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  RelationId,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { PlayerTournament } from '@players/entities/player-tournament.entity';

@Entity('pitcher_stats')
@Unique(['playerTournament'])
export class PitcherStat {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @OneToOne(() => PlayerTournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_tournament_id' })
  playerTournament: PlayerTournament;
  @Column({ name: 'player_tournament_id' })
  playerTournamentId: number;

  @Column({ default: 0 })
  strikeouts: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
