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
  playerName: string;
  @IsString()
  @ApiProperty({
    description: '팀 이름',
    example: '포톤스',
  })
  teamName: string;
  @IsInt()
  @ApiProperty({
    description: '팀 경기 수',
    example: 10,
  })
  teamGameCount: number;
  @IsInt()
  @ApiProperty({
    description: '타수',
    example: 10,
  })
  AB: number;
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
    description: '볼넷',
    example: 10,
  })
  BB: number;
  @IsString()
  @ApiProperty({
    description: '타율',
    example: '0.333',
  })
  AVG: string;
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
  playerName: string;
  @IsString()
  @ApiProperty({
    description: '팀 이름',
    example: '포톤스',
  })
  teamName: string;
  @IsInt()
  @ApiProperty({
    description: '삼진',
    example: 10,
  })
  K: number;
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
