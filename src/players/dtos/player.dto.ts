import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class BasePlayerDto {
  @ApiProperty({
    description: '선수 ID',
    example: 1,
  })
  @IsInt()
  id: number;
  @ApiProperty({
    description: '선수 이름',
    example: '홍길동',
  })
  @IsString()
  name: string;
  @ApiProperty({
    description: '학과 이름',
    example: '홍길동',
  })
  @IsString()
  departmentName: string;
  @ApiProperty({
    description: '와일드카드 여부',
    example: true,
  })
  @IsBoolean()
  isWc: boolean;

  @ApiProperty({
    description: '선출 여부',
    example: true,
  })
  @IsBoolean()
  isElite: boolean;
}

export class PlayerWithLineupDto extends BasePlayerDto {
  @ApiProperty({
    description: '라인업 포함 여부',
    example: true,
  })
  inLineup: boolean;
}

export class PlayerWithSubstitutableDto extends BasePlayerDto {
  @ApiProperty({
    description: '교체 가능 여부',
    example: true,
  })
  isSubstitutable: boolean;
}

export class BasePlayerListResponseDto {
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
    description: '팀선수 목록',
    type: [BasePlayerDto],
  })
  players: BasePlayerDto[];
}
export class PlayerWithLineupListResponseDto {
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
    description: '선수 목록',
    type: [PlayerWithLineupDto],
  })
  players: PlayerWithLineupDto[];
}
export class PlayerWithSubstitutableListResponseDto {
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
    description: '선수 목록',
    type: [PlayerWithSubstitutableDto],
  })
  players: PlayerWithSubstitutableDto[];
}
