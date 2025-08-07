import { ScoreboardResponseDto } from './score.dto';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
export class BatterDailyStats {
  @IsInt()
  batterGameStatsId: number;

  @IsString()
  playerName: string;

  @IsInt()
  battingOrder: number;

  @IsInt()
  substitutionOrder: number;

  @IsInt()
  PA: number;

  @IsInt()
  AB: number;

  @IsInt()
  H: number;

  @IsInt()
  '2B': number;

  @IsInt()
  '3B': number;

  @IsInt()
  HR: number;

  @IsInt()
  R: number;

  @IsInt()
  RBI: number;

  @IsInt()
  SF: number;

  @IsInt()
  SAC: number;

  @IsInt()
  BB: number;

  @IsInt()
  SO: number;
}

export class PitcherDailyStats {
  @IsInt()
  pitcherGameStatsId: number;

  @IsString()
  playerName: string;

  @IsInt()
  IP: number;

  @IsInt()
  R: number;

  @IsInt()
  ER: number;

  @IsInt()
  K: number;

  @IsInt()
  BB: number;
}

class TeamBatterStats {
  @IsArray()
  @ValidateNested()
  @Type(() => BatterDailyStats)
  home: BatterDailyStats[];

  @IsArray()
  @ValidateNested()
  @Type(() => BatterDailyStats)
  away: BatterDailyStats[];
}

class TeamPitcherStats {
  @IsArray()
  @ValidateNested()
  @Type(() => PitcherDailyStats)
  home: PitcherDailyStats[];

  @IsArray()
  @ValidateNested()
  @Type(() => PitcherDailyStats)
  away: PitcherDailyStats[];
}

export class GameResultsResponseDto extends ScoreboardResponseDto {
  @ValidateNested()
  @Type(() => TeamBatterStats)
  batterStats: TeamBatterStats;

  @ValidateNested()
  @Type(() => TeamPitcherStats)
  pitcherStats: TeamPitcherStats;
}

export class UpdateBatterStatsDto {
  @IsInt()
  @IsOptional()
  @Min(0)
  PA: number;
  @IsInt()
  @IsOptional()
  @Min(0)
  AB: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  H: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  '2B': number;

  @IsInt()
  @IsOptional()
  @Min(0)
  '3B': number;

  @IsInt()
  @IsOptional()
  @Min(0)
  HR: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  SAC: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  SF: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  R: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  RBI: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  BB: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  SO: number;
}

export class UpdatePitcherStatsDto {
  @IsInt()
  @IsOptional()
  @Min(0)
  IP: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  R: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  ER: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  K: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  BB: number;
}
