import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Team } from './team.entity';
import { Tournament } from '@/tournaments/tournament.entity';

@Entity('team_tournaments')
export class TeamTournament {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Team, (team) => team.teamTournaments)
  team: Team;

  @ManyToOne(() => Tournament, (tournament) => tournament.teamTournaments)
  tournament: Tournament;

  @Column()
  group: string;

  @Column({ default: 0 })
  games: number;

  @Column({ default: 0 })
  wins: number;

  @Column({ default: 0 })
  draws: number;

  @Column({ default: 0 })
  losses: number;

  @Column({ default: 0 })
  rank: number;

  // 추가 통계 데이터를 위한 컬럼들
  @Column({ default: 0 })
  runsScored: number; // 득점

  @Column({ default: 0 })
  runsAllowed: number; // 실점

  // 생성/수정 시간 추적
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
