import { GameStatus } from '@/common/enums/game-status.enum';
import { InningHalf } from '@/common/enums/inning-half.enum';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MatchStage } from '@/common/enums/match-stage.enum';
export class TeamSummaryDto {
  @ApiProperty({
    description: '팀 ID',
    example: 1,
  })
  @IsInt()
  id: number;
  @ApiProperty({
    description: '팀 이름',
    example: '포톤스',
  })
  @IsString()
  name: string;
  @ApiProperty({
    description: '팀 점수',
    example: 0,
  })
  @IsInt()
  score: number | null;
}

export class GameDto {
  @ApiProperty({
    description: '경기 ID',
    example: 1,
  })
  @IsInt()
  id: number;
  @ApiProperty({
    description: '경기 시간',
    example: '2025-04-30T12:00:00',
  })
  @IsString()
  time: string;
  @ApiProperty({
    description: '경기 상태',
    example: GameStatus.IN_PROGRESS,
  })
  @IsEnum(GameStatus)
  status: GameStatus;
  @ApiProperty({
    description: '경기 이닝',
    example: 1,
  })
  @IsEnum(MatchStage)
  @ApiProperty({
    description: '경기 단계',
    example: MatchStage.LEAGUE,
  })
  stage: MatchStage;

  @IsInt()
  @IsOptional()
  inning: number | null;
  @ApiProperty({
    description: '초/말',
    example: InningHalf.TOP,
  })
  @IsEnum(InningHalf)
  @IsOptional()
  inningHalf: InningHalf | null;

  @ApiProperty({
    description: '홈팀',
    type: TeamSummaryDto,
  })
  @ValidateNested()
  @Type(() => TeamSummaryDto)
  homeTeam: TeamSummaryDto;

  @ApiProperty({
    description: '원정팀',
    type: TeamSummaryDto,
  })
  @ValidateNested()
  @Type(() => TeamSummaryDto)
  awayTeam: TeamSummaryDto;

  @ApiProperty({
    description: '몰수게임 여부',
    example: false,
  })
  @IsBoolean()
  isForfeit: boolean;

  @ApiProperty({
    description: '기록 가능 여부 (심판인 경우 true)',
    example: true,
  })
  @IsBoolean()
  canRecord: boolean;

  // @ApiProperty({
  //   description: '라인업 제출 가능 여부',
  //   example: { home: false, away: true },
  // })
  // canSubmitLineup: {
  //   home: boolean;
  //   away: boolean;
  // };

  @ApiProperty({
    description: '승자 팀 ID',
    example: 1,
  })
  @IsInt()
  winnerTeamId: number | null;
}

export class GameScheduleResponseDto {
  @ApiProperty({
    description: '날짜',
    example: '2025-04-30',
  })
  @IsString()
  date: string;

  @ApiProperty({
    description: '요일',
    example: '월',
  })
  @IsString()
  dayOfWeek: string;

  @ApiProperty({
    description: '경기 목록',
    type: GameDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested()
  @Type(() => GameDto)
  games: GameDto[];
}
export class RangeDto {
  @IsString()
  @ApiProperty({
    description: '시작 날짜',
    example: '2025-04-30',
  })
  from: string;
  @IsString()
  @ApiProperty({
    description: '종료 날짜',
    example: '2025-05-01',
  })
  to: string;
}

export class GamesByDatesResponseDto {
  @ValidateNested()
  @Type(() => RangeDto)
  range: RangeDto;

  @IsArray()
  @ValidateNested()
  @Type(() => GameScheduleResponseDto)
  days: GameScheduleResponseDto[];
}
