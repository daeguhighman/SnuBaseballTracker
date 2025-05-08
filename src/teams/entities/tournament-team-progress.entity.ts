import { Entity, OneToOne } from 'typeorm';

import { Column, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Team } from './team.entity';
import { Tournament } from '@/tournaments/entities/tournament.entity';
import { MatchStage } from '@common/enums/match-stage.enum';
@Entity('tournament_team_progress')
export class TournamentTeamProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Team)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @OneToOne(() => Tournament)
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Column({
    type: 'enum',
    enum: MatchStage,
    default: MatchStage.LEAGUE,
  })
  stage: MatchStage;

  @Column() isEliminated: boolean;
}
