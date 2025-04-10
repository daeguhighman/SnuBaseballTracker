import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { Department } from './department.entity';
import { PlayerTournament } from './player-tournament';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'is_wildcard' })
  isWildcard: boolean;

  @Column({ name: 'is_elite' })
  isElite: boolean;

  @ManyToOne(() => Team, (team) => team.players)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @OneToMany(
    () => PlayerTournament,
    (playerTournament) => playerTournament.player,
  )
  playerTournaments: PlayerTournament[];
}
