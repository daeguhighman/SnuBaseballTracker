import { IsBoolean, IsInt, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CurrentBatterResponseDto {
  @IsInt()
  @ApiProperty({
    description: '선수 ID',
    example: 1,
  })
  playerId: number;
  @IsString()
  @ApiProperty({
    description: '선수 이름',
    example: '홍길동',
  })
  playerName: string;
  @IsString()
  @ApiProperty({
    description: '포지션',
    example: '1루수',
  })
  position: string;
  @IsInt()
  @ApiProperty({
    description: '타순',
    example: 1,
  })
  battingOrder: number;

  @IsBoolean()
  @ApiProperty({
    description: 'WC 여부',
    example: false,
  })
  isWc: boolean;

  @IsBoolean()
  @ApiProperty({
    description: '선출 여부',
    example: false,
  })
  isElite: boolean;
}

export class CurrentPitcherResponseDto {
  @IsInt()
  @ApiProperty({
    description: '선수 ID',
    example: 1,
  })
  playerId: number;
  @IsString()
  @ApiProperty({
    description: '선수 이름',
    example: '홍길동',
  })
  playerName: string;
  @IsString()
  @ApiProperty({
    description: '포지션',
    example: '투수',
  })
  position: string;

  @IsBoolean()
  @ApiProperty({
    description: '와일드카드 여부',
    example: false,
  })
  isWc: boolean;

  @IsBoolean()
  @ApiProperty({
    description: '선출 여부',
    example: false,
  })
  isElite: boolean;
}
