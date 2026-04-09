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
import { BasePitcherStat } from '../../common/entities/base-pitcher-stat.entity';

@Entity('pitcher_stats')
@Unique(['playerTournament'])
export class PitcherStat extends BasePitcherStat {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @OneToOne(() => PlayerTournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_tournament_id' })
  playerTournament: PlayerTournament;
  @Column({ name: 'player_tournament_id' })
  playerTournamentId: number;

  @Column({
    name: 'era',
    type: 'decimal',
    precision: 5, // 4에서 5로 증가 (99.99를 저장할 수 있도록)
    scale: 2, // 3에서 2로 변경 (소수점 2자리)
    default: 0,
  })
  era: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
