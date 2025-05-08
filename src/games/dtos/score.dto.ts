import { InningHalf } from '@common/enums/inning-half.enum';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
// POST /games/{gameId}/scores request
export class SimpleScoreRequestDto {
  @IsInt()
  @ApiProperty({
    description: '점수',
    example: 1,
  })
  runs: number;
}

// GET & POST /games/{gameId}/scores response
export class InningHalfScoreDto {
  @IsInt()
  @ApiProperty({
    description: '이닝',
    example: 1,
  })
  inning: number;
  @IsEnum(InningHalf)
  @ApiProperty({
    description: '초/말',
    example: InningHalf.TOP,
  })
  inningHalf: InningHalf;
  @IsInt()
  @ApiProperty({
    description: '점수',
    example: 1,
  })
  runs: number;
}

export class TeamScoreSummaryDto {
  @IsInt()
  @ApiProperty({
    description: '팀 ID',
    example: 1,
  })
  id: number;
  @IsString()
  @ApiProperty({
    description: '팀 이름',
    example: '포톤스',
  })
  name: string;
  @IsInt()
  @ApiProperty({
    description: '팀 점수',
    example: 1,
  })
  runs: number;
  @IsInt()
  @ApiProperty({
    description: '팀 안타',
    example: 1,
  })
  hits: number;
}
export class TeamSummaryWithStatsDto {
  @ApiProperty({
    description: '홈팀',
    type: TeamScoreSummaryDto,
  })
  @ValidateNested()
  @Type(() => TeamScoreSummaryDto)
  home: TeamScoreSummaryDto;

  @ApiProperty({
    description: '원정팀',
    type: TeamScoreSummaryDto,
  })
  @ValidateNested()
  @Type(() => TeamScoreSummaryDto)
  away: TeamScoreSummaryDto;
}
export class ScoreboardResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InningHalfScoreDto)
  @ApiProperty({
    description: '이닝 점수',
    type: InningHalfScoreDto,
    isArray: true,
  })
  scoreboard: InningHalfScoreDto[];
  @ValidateNested()
  @Type(() => TeamSummaryWithStatsDto)
  @ApiProperty({
    description: '팀 점수 요약',
    type: TeamSummaryWithStatsDto,
  })
  teamSummary: TeamSummaryWithStatsDto;
}

// PATCH request
export class InningHalfScoreUpdateDto {
  @IsInt()
  @ApiProperty({
    description: '점수',
    example: 1,
  })
  runs: number;
}
