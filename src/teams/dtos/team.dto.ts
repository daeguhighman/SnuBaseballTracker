import { Exclude, Type } from 'class-transformer';
import { IsNumber, IsObject, IsString } from 'class-validator';
import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
export class TeamDto {
  @IsNumber()
  @ApiProperty({
    description: '팀 ID',
    example: 1,
  })
  id: number;

  @IsString()
  @ApiProperty({
    description: '팀 이름',
    example: '포톤스',
  })
  name: string;

  @IsNumber()
  @ApiProperty({
    description: '경기 수',
    example: 10,
  })
  games: number;

  @IsNumber()
  @ApiProperty({
    description: '승',
    example: 10,
  })
  wins: number;

  @IsNumber()
  @ApiProperty({
    description: '무',
    example: 10,
  })
  draws: number;
  @IsNumber()
  @ApiProperty({
    description: '패',
    example: 10,
  })
  losses: number;

  @IsNumber()
  @ApiProperty({
    description: '순위',
    example: 1,
  })
  rank: number;

  @Exclude()
  @ApiProperty({
    description: '승률',
    example: 0.5,
  })
  winningPercentage: number;
}

export class GroupedTeamResponseDto {
  [key: string]: TeamDto[];
}
