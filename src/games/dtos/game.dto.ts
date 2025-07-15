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
import { MatchStage } from '@/common/enums/match-stage.enum';
export class TeamSummaryDto {
  @IsInt()
  id: number;
  @IsString()
  name: string;
  @IsInt()
  score: number | null;
}

export class SubmitLineupRoleDto {
  @IsBoolean()
  home: boolean;

  @IsBoolean()
  away: boolean;
}
export class GameDto {
  @IsInt()
  gameId: number;
  @IsString()
  time: string;
  @IsEnum(GameStatus)
  status: GameStatus;
  @IsEnum(MatchStage)
  stage: MatchStage;

  @IsInt()
  @IsOptional()
  inning: number | null;

  @IsEnum(InningHalf)
  @IsOptional()
  inningHalf: InningHalf | null;

  @ValidateNested()
  @Type(() => TeamSummaryDto)
  homeTeam: TeamSummaryDto;

  @ValidateNested()
  @Type(() => TeamSummaryDto)
  awayTeam: TeamSummaryDto;

  @IsBoolean()
  isForfeit: boolean;

  @IsInt()
  winnerTeamId: number | null;

  @ValidateNested()
  @Type(() => SubmitLineupRoleDto)
  canSubmitLineup: SubmitLineupRoleDto;

  @IsBoolean()
  canRecord: boolean;
}

export class GameScheduleResponseDto {
  @IsString()
  date: string;

  @IsString()
  dayOfWeek: string;

  @IsArray()
  @ValidateNested()
  @Type(() => GameDto)
  games: GameDto[];
}
export class RangeDto {
  @IsString()
  from: string;
  @IsString()
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
