import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Team } from '@teams/entities/team.entity';
import { Department } from './department.entity';
import { PlayerTournament } from './player-tournament.entity';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ name: 'is_wildcard', default: false })
  isWc: boolean;

  @Column({ name: 'is_elite', default: false })
  isElite: boolean;

  @Index()
  @ManyToOne(() => Team, (team) => team.players, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ name: 'team_id', nullable: true })
  teamId: number;

  @Index()
  @ManyToOne(() => Department, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @Column({ name: 'department_id', nullable: true })
  departmentId?: number;

  @OneToMany(
    () => PlayerTournament,
    (playerTournament) => playerTournament.player,
    {
      cascade: ['insert', 'update', 'soft-remove'],
      eager: false,
    },
  )
  playerTournaments: PlayerTournament[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
