import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class BatterRecord {
  @IsString()
  @ApiProperty({
    description: '선수 이름',
    example: '홍길동',
  })
  name: string;
  @IsString()
  @ApiProperty({
    description: '팀 이름',
    example: '포톤스',
  })
  team: string;
  @IsInt()
  @ApiProperty({
    description: '팀 경기 수',
    example: 10,
  })
  teamGameCount: number;
  @IsString()
  @ApiProperty({
    description: '타율',
    example: '0.333',
  })
  AVG: string;
  @IsInt()
  @ApiProperty({
    description: '타석',
    example: 100,
  })
  PA: number;
  @IsInt()
  @ApiProperty({
    description: '타수',
    example: 10,
  })
  AB: number;
  @IsInt()
  @ApiProperty({
    description: '안타',
    example: 12,
  })
  H: number;
  @IsInt()
  @ApiProperty({
    description: '2루타',
    example: 10,
  })
  '2B': number;
  @IsInt()
  @ApiProperty({
    description: '3루타',
    example: 10,
  })
  '3B': number;
  @IsInt()
  @ApiProperty({
    description: '홈런',
    example: 0,
  })
  HR: number;
  @IsInt()
  @ApiProperty({
    description: '타점',
    example: 8,
  })
  RBI: number;
  @IsInt()
  @ApiProperty({
    description: '득점',
    example: 5,
  })
  R: number;
  @IsInt()
  @ApiProperty({
    description: '볼넷',
    example: 10,
  })
  BB: number;
  @IsInt()
  @ApiProperty({
    description: '삼진',
    example: 3,
  })
  SO: number;
  @IsString()
  @ApiProperty({
    description: '출루율',
    example: '0.333',
  })
  OBP: string;
  @IsString()
  @ApiProperty({
    description: '장타율',
    example: '0.333',
  })
  SLG: string;
  @IsString()
  @ApiProperty({
    description: 'OPS',
    example: '0.888',
  })
  OPS: string;
}

export class BatterRecordsResponse {
  @IsInt()
  @ApiProperty({
    description: '선수 수',
    example: 10,
  })
  count: number;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatterRecord)
  @ApiProperty({
    description: '선수 목록',
    type: [BatterRecord],
  })
  batters: BatterRecord[];
}

export class PitcherRecord {
  @IsString()
  @ApiProperty({
    description: '선수 이름',
    example: '홍길동',
  })
  name: string;
  @IsString()
  @ApiProperty({
    description: '팀 이름',
    example: '포톤스',
  })
  team: string;
  @IsString()
  @ApiProperty({
    description: '평균자책점',
    example: '2.50',
  })
  ERA: string;
  @IsInt()
  @ApiProperty({
    description: '이닝',
    example: 15,
  })
  IP: number;
  @IsInt()
  @ApiProperty({
    description: '실점',
    example: 8,
  })
  R: number;
  @IsInt()
  @ApiProperty({
    description: '자책점',
    example: 6,
  })
  ER: number;
  @IsInt()
  @ApiProperty({
    description: '삼진',
    example: 10,
  })
  K: number;
  @IsInt()
  @ApiProperty({
    description: '사사구',
    example: 5,
  })
  BB: number;
}

export class PitcherRecordsResponse {
  @IsInt()
  @ApiProperty({
    description: '선수 수',
    example: 10,
  })
  count: number;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PitcherRecord)
  @ApiProperty({
    description: '선수 목록',
    type: [PitcherRecord],
  })
  pitchers: PitcherRecord[];
}
