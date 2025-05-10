import { IsInt, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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
