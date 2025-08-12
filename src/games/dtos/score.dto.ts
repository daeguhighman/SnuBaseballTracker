import { InningHalf } from '@/common/enums/inning-half.enum';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsString,
  ValidateNested,
  IsOptional,
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

// 새로운 이닝별 점수 DTO (홈팀/원정팀 점수 포함)
export class InningScoreDto {
  @IsInt()
  @ApiProperty({
    description: '이닝',
    example: 1,
  })
  inning: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({
    description: '원정팀 점수',
    example: 2,
    nullable: true,
  })
  away: number | null;

  @IsOptional()
  @IsInt()
  @ApiProperty({
    description: '홈팀 점수',
    example: 1,
    nullable: true,
  })
  home: number | null;
}

// 기존 InningHalfScoreDto (하위 호환성을 위해 유지)
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
  @ValidateNested()
  @ApiProperty({
    description: '스코어보드 정보',
    type: () => Object,
    properties: {
      innings: {
        type: 'array',
        items: { $ref: '#/components/schemas/InningScoreDto' },
        description: '이닝별 점수 (홈팀/원정팀)',
      },
    },
  })
  scoreboard: {
    innings: InningScoreDto[];
  };

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
