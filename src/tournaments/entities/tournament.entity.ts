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
import { UmpireTournament } from '@umpires/entities/umpire-tournament.entity';
import { PhaseType } from '@common/enums/phase-type.enum';
@Entity('tournaments')
@Unique(['year', 'name'])
export class Tournament {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @Column({ length: 100 })
  name: string;

  @Index()
  @Column()
  year: number;

  @OneToMany(() => TeamTournament, (tt) => tt.tournament, {
    cascade: ['insert', 'update'],
  })
  teamTournaments: TeamTournament[];

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
