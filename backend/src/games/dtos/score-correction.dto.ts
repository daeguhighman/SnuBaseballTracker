import { IsEnum, IsIn, IsInt, Max, Min } from 'class-validator';
import { InningHalf } from '@common/enums/inning-half.enum';

/** 종료된 경기의 이닝 점수 정정 */
export class CorrectInningRunsDto {
  @IsInt()
  @Min(1)
  inning: number;

  @IsEnum(InningHalf)
  inningHalf: InningHalf;

  @IsInt()
  @Min(0)
  @Max(99)
  runs: number;
}

/** 종료된 경기의 팀 안타 수 정정 */
export class CorrectTeamHitsDto {
  @IsIn(['home', 'away'])
  team: 'home' | 'away';

  @IsInt()
  @Min(0)
  @Max(99)
  hits: number;
}
