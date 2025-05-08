import { ScoreboardResponseDto } from './score.dto';
import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
export class BatterDailyStats {
  @ApiProperty({
    description: '선수 게임 통계 ID',
    example: 1,
  })
  @IsInt()
  batterGameStatsId: number;

  @IsString()
  @ApiProperty({
    description: '선수 이름',
    example: '홍길동',
  })
  playerName: string;

  @IsInt()
  @ApiProperty({
    description: '타순',
    example: 1,
  })
  battingOrder: number;

  @IsInt()
  @ApiProperty({
    description: '교체 순서',
    example: 1,
  })
  substitutionOrder: number;

  @IsInt()
  @ApiProperty({
    description: '타석',
    example: 1,
  })
  PA: number;

  @IsInt()
  @ApiProperty({
    description: '타수',
    example: 1,
  })
  AB: number;

  @IsInt()
  @ApiProperty({
    description: '안타',
    example: 1,
  })
  H: number;

  @IsInt()
  @ApiProperty({
    description: '볼넷',
    example: 1,
  })
  BB: number;

  @IsInt()
  @ApiProperty({
    description: '2루타',
    example: 1,
  })
  '2B': number;

  @IsInt()
  @ApiProperty({
    description: '3루타',
    example: 1,
  })
  '3B': number;

  @IsInt()
  @ApiProperty({
    description: '홈런',
    example: 1,
  })
  HR: number;

  @IsInt()
  @ApiProperty({
    description: '희생플라이',
    example: 1,
  })
  SAC: number;
}

export class PitcherDailyStats {
  @ApiProperty({
    description: '선수 게임 통계 ID',
    example: 1,
  })
  @IsInt()
  pitcherGameStatsId: number;

  @IsString()
  @ApiProperty({
    description: '선수 이름',
    example: '홍길동',
  })
  playerName: string;

  @IsInt()
  @ApiProperty({
    description: '삼진',
    example: 1,
  })
  K: number;
}

class TeamBatterStats {
  @IsArray()
  @ValidateNested()
  @Type(() => BatterDailyStats)
  @ApiProperty({
    description: '홈팀 선수 통계',
    type: [BatterDailyStats],
  })
  home: BatterDailyStats[];

  @IsArray()
  @ValidateNested()
  @Type(() => BatterDailyStats)
  @ApiProperty({
    description: '원정팀 선수 통계',
    type: [BatterDailyStats],
  })
  away: BatterDailyStats[];
}

class TeamPitcherStats {
  @IsArray()
  @ValidateNested()
  @Type(() => PitcherDailyStats)
  @ApiProperty({
    description: '홈팀 선수 통계',
    type: [PitcherDailyStats],
  })
  home: PitcherDailyStats[];

  @IsArray()
  @ValidateNested()
  @Type(() => PitcherDailyStats)
  @ApiProperty({
    description: '원정팀 선수 통계',
    type: [PitcherDailyStats],
  })
  away: PitcherDailyStats[];
}

export class GameResultsResponseDto extends ScoreboardResponseDto {
  @ValidateNested()
  @Type(() => TeamBatterStats)
  @ApiProperty({
    description: '홈팀 선수 통계',
    type: TeamBatterStats,
  })
  batterStats: TeamBatterStats;

  @ValidateNested()
  @Type(() => TeamPitcherStats)
  @ApiProperty({
    description: '홈팀 선수 통계',
    type: TeamPitcherStats,
  })
  pitcherStats: TeamPitcherStats;
}

export class UpdateBatterStatsDto {
  @IsInt()
  @ApiProperty({
    description: '타석',
    example: 1,
  })
  @IsOptional()
  @Min(0)
  PA: number;
  @IsInt()
  @ApiProperty({
    description: '타수',
    example: 1,
  })
  @IsOptional()
  @Min(0)
  AB: number;

  @IsInt()
  @ApiProperty({
    description: '안타',
    example: 1,
  })
  @IsOptional()
  @Min(0)
  H: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: '볼넷',
    example: 1,
  })
  BB: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: '2루타',
    example: 1,
  })
  '2B': number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: '3루타',
    example: 1,
  })
  '3B': number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: '홈런',
    example: 1,
  })
  HR: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: '희생플라이',
    example: 1,
  })
  SAC: number;
}

export class UpdatePitcherStatsDto {
  @IsInt()
  @ApiProperty({
    description: '삼진',
    example: 1,
  })
  @IsOptional()
  @Min(0)
  K: number;
}
