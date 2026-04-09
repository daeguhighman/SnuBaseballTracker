import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  RelationId,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Unique,
  Index,
  Column,
  JoinColumn,
} from 'typeorm';
import { Umpire } from '@umpires/entities/umpire.entity';
import { Tournament } from '@tournaments/entities/tournament.entity';

@Entity('umpire_tournaments')
@Unique(['umpire', 'tournament'])
export class UmpireTournament {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @ManyToOne(() => Umpire, (u) => u.umpireTournaments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'umpire_id' })
  umpire: Umpire;
  @Column({ name: 'umpire_id' })
  umpireId: number;

  @Index()
  @ManyToOne(() => Tournament, (t) => t.umpireTournaments, {
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
