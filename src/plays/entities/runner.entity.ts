import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Play } from './play.entity';
import { BatterGameParticipation } from '@/games/entities/batter-game-participation.entity';

// Runner.ts ― 주자 생명주기를 대표
@Entity()
export class Runner {
  @PrimaryGeneratedColumn()
  id: number;

  /* ------ 주자 자체 ------ */
  @ManyToOne(() => BatterGameParticipation) // 주자의 GP(선수·대주자 바뀌면 새 Runner)
  runnerGp: BatterGameParticipation;

  /* ------ 책임 정보 ------ */
  @ManyToOne(() => BatterGameParticipation) // 이 Runner를 ‘출루시킨’ 투수
  responsiblePitcherGp: BatterGameParticipation;

  @ManyToOne(() => Play) // 어떤 타석에서 출루했는가
  originPlay: Play;

  @Column({ default: false })
  reachedOnError: boolean; // E/PB/CI 등으로 출루?
}
