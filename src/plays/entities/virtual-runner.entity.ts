import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Play } from './play.entity';
import { BatterGameParticipation } from '@/games/entities/batter-game-participation.entity';
import { GameInningStat } from '@/games/entities/game-inning-stat.entity';
import { PitcherGameParticipation } from '@/games/entities/pitcher-game-participation.entity';

// VirtualRunner.ts ― 가상 주자 생명주기를 대표
@Entity('virtual_runners')
export class VirtualRunner {
  @PrimaryGeneratedColumn()
  id: number;

  /* ------ 주자 자체 ------ */
  @ManyToOne(() => BatterGameParticipation) // 주자의 GP(선수·대주자 바뀌면 새 VirtualRunner)
  @JoinColumn({ name: 'runner_gp_id' })
  runnerGp: BatterGameParticipation;

  @Column({ name: 'runner_gp_id' })
  runnerGpId: number;

  /* ------ 책임 정보 ------ */
  @ManyToOne(() => PitcherGameParticipation) // 이 VirtualRunner를 '출루시킨' 투수
  @JoinColumn({ name: 'responsible_pitcher_gp_id' })
  responsiblePitcherGp: PitcherGameParticipation;

  @Column({ name: 'responsible_pitcher_gp_id' })
  responsiblePitcherGpId: number;

  @ManyToOne(() => Play) // 어떤 타석에서 출루했는가
  originPlay: Play;

  @ManyToOne(() => GameInningStat)
  @JoinColumn({ name: 'game_inning_stat_id' })
  gameInningStat: GameInningStat;

  @Column({ name: 'game_inning_stat_id' })
  gameInningStatId: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean; // 현재 루상에 있는지 여부 (true: 루상, false: 아웃/득점)
}
