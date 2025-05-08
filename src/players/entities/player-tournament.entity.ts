import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  Index,
  Column,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Player } from './player.entity';
import { Tournament } from '@tournaments/entities/tournament.entity';

@Entity('player_tournaments')
@Unique(['player', 'tournament'])
export class PlayerTournament {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @ManyToOne(() => Player, (player) => player.playerTournaments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'player_id' })
  player: Player;

  @Column({ name: 'player_id' })
  playerId: number;

  @Index()
  @ManyToOne(() => Tournament, (tourn) => tourn.playerTournaments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Column({ name: 'tournament_id' })
  tournamentId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
