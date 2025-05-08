import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { TeamTournament } from '@teams/entities/team-tournament.entity';
import { PlayerTournament } from '@players/entities/player-tournament.entity';
import { TournamentSeason } from '@common/enums/tournament-season.enum';
import { UmpireTournament } from '@umpires/entities/umpire-tournament.entity';
import { PhaseType } from '@common/enums/phase-type.enum';
@Entity('tournaments')
@Unique(['year', 'season', 'name'])
export class Tournament {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @Column({ length: 100 })
  name: string;

  @Index()
  @Column()
  year: number;

  @Column({
    type: 'enum',
    enum: TournamentSeason,
  })
  season: TournamentSeason;

  @OneToMany(() => TeamTournament, (tt) => tt.tournament, {
    cascade: ['insert', 'update'],
  })
  teamTournaments: TeamTournament[];

  @OneToMany(() => PlayerTournament, (pt) => pt.tournament, {
    cascade: ['insert', 'update'],
  })
  playerTournaments: PlayerTournament[];

  @OneToMany(() => UmpireTournament, (ut) => ut.tournament, {
    cascade: ['insert', 'update'],
  })
  umpireTournaments: UmpireTournament[];

  @Column({
    type: 'enum',
    enum: PhaseType,
    default: PhaseType.LEAGUE,
  })
  phase: PhaseType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
