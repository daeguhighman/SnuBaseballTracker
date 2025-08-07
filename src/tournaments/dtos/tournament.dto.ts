import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsEnum } from 'class-validator';
import { TournamentType } from '@common/enums/tournament-type.enum';

export class TournamentDto {
  @IsInt()
  @ApiProperty({
    description: '토너먼트 ID',
    example: 1,
  })
  id: number;

  @IsEnum(TournamentType)
  @ApiProperty({
    description: '토너먼트 이름',
    enum: TournamentType,
    example: TournamentType.CHONGJANG,
  })
  name: TournamentType;

  @IsInt()
  @ApiProperty({
    description: '토너먼트 연도',
    example: 2025,
  })
  year: number;
}

export class TournamentListResponseDto {
  @ApiProperty({
    description: '토너먼트 목록',
    type: [TournamentDto],
  })
  tournaments: TournamentDto[];

  @ApiProperty({
    description: '토너먼트 총 개수',
    example: 5,
  })
  count: number;
}
