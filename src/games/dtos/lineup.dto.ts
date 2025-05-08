import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class BaseLineupBatterDto {
  @IsInt()
  @ApiProperty({ description: '타순', example: 1 })
  battingOrder: number;

  @IsInt()
  @ApiProperty({ description: '선수 ID', example: 1 })
  playerId: number;

  @IsString()
  @ApiProperty({ description: '포지션', example: '1루수' })
  position: string;
}
export class LineupRequestBatterDto extends BaseLineupBatterDto {}

export class BaseLineupPitcherDto {
  @ApiProperty({
    description: '선수 ID',
    example: 1,
  })
  @IsInt()
  playerId: number;
}
export class LineupRequestPitcherDto extends BaseLineupPitcherDto {}
export class SubmitLineupRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineupRequestBatterDto)
  @ApiProperty({
    description: '타자 목록',
    type: LineupRequestBatterDto,
    isArray: true,
  })
  batters: LineupRequestBatterDto[];
  @ValidateNested()
  @Type(() => LineupRequestPitcherDto)
  @ApiProperty({
    description: '투수',
    type: LineupRequestPitcherDto,
  })
  pitcher: LineupRequestPitcherDto;
}

export class SubmitSubstituteRequestDto {
  @IsArray()
  @IsInt({ each: true })
  @ApiProperty({
    description: '선수 ID 목록',
    example: [1, 2, 3],
  })
  playerIds: number[];
}

export class LineupBatterResponseDto extends BaseLineupBatterDto {
  @IsString()
  @ApiProperty({
    description: '선수 이름',
    example: '홍길동',
  })
  playerName: string;

  @IsBoolean()
  @ApiProperty({
    description: 'WC 여부',
    example: false,
  })
  isWc: boolean;
}
export class LineupPitcherResponseDto extends BaseLineupPitcherDto {
  @IsString()
  @ApiProperty({
    description: '선수 이름',
    example: '홍길동',
  })
  playerName: string;

  @IsBoolean()
  @ApiProperty({
    description: 'WC 여부',
    example: false,
  })
  isWc: boolean;
}

export class LineupResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineupBatterResponseDto)
  @ApiProperty({
    description: '타자 목록',
    type: LineupBatterResponseDto,
    isArray: true,
  })
  batters: LineupBatterResponseDto[];
  @ValidateNested()
  @Type(() => LineupPitcherResponseDto)
  @ApiProperty({
    description: '투수',
    type: LineupPitcherResponseDto,
  })
  pitcher: LineupPitcherResponseDto;
}

export class SubmitSubstitutionResponseDto {
  @IsBoolean()
  @ApiProperty({
    description: '성공 여부',
    example: true,
  })
  success: boolean;
  @IsArray()
  @IsInt({ each: true })
  @ApiProperty({
    description: '선수 ID 목록',
    example: [1, 2, 3],
  })
  playerIds: number[];
}
