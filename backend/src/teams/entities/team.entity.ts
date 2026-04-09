import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';
import { TeamTournament } from '@teams/entities/team-tournament.entity';

@Unique(['name'])
@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 100 })
  name: string;

  @OneToMany(() => TeamTournament, (tt) => tt.team)
  teamTournaments: TeamTournament[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
