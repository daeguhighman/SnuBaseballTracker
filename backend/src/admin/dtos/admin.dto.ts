import {
  IsInt,
  IsDate,
  IsOptional,
  IsEnum,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  BracketPosition,
  MatchStage,
} from '@common/enums/match-stage.enum';

export class UmpireRequestDto {
  @ApiProperty({
    description: '경기 ID',
    example: 1,
  })
  @IsInt()
  gameId: number;

  @ApiProperty({
    description: '심판 ID',
    example: 1,
  })
  @IsInt()
  umpireId: number;
}

export class UpdateScheduleDto {
  @ApiProperty({
    description: '경기 ID',
    example: 1,
  })
  @IsInt()
  gameId: number;

  @ApiProperty({
    description: '경기 시작 시간',
    example: '2025-04-26T12:00:00',
  })
  @Type(() => Date)
  @IsDate()
  startTime: Date;
}

export class CreateGameDto {
  @ApiProperty({ description: '대회 ID', example: 1 })
  @IsInt()
  tournamentId: number;

  @ApiProperty({
    description: '홈팀(후공) team-tournament ID',
    example: 1,
  })
  @IsInt()
  homeTeamTournamentId: number;

  @ApiProperty({
    description: '어웨이팀(선공) team-tournament ID',
    example: 2,
  })
  @IsInt()
  awayTeamTournamentId: number;

  @ApiProperty({
    description: '경기 단계',
    enum: MatchStage,
    example: MatchStage.LEAGUE,
  })
  @IsEnum(MatchStage)
  stage: MatchStage;

  @ApiProperty({
    description: '브래킷 포지션',
    enum: BracketPosition,
    required: false,
  })
  @IsOptional()
  @IsEnum(BracketPosition)
  bracketPosition?: BracketPosition;

  @ApiProperty({
    description: '조 이름 (UI 표시용 메모)',
    example: 'A',
    required: false,
  })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiProperty({
    description: '경기 시작 시간 (ISO 문자열, 미입력시 null)',
    example: '2026-05-10T19:00:00+09:00',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startTime?: Date;
}

export class ForfeitGameDto {
  @ApiProperty({
    description: '경기 ID',
    example: 1,
  })
  @IsInt()
  gameId: number;

  @ApiProperty({
    description: '팀 ID',
    example: 1,
  })
  @IsInt()
  winnerTeamId: number;
}
