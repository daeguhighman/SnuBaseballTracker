import { ApiProperty } from '@nestjs/swagger';

import { TeamSummaryDto } from '@games/dtos/game.dto';
import { BracketPosition } from '@common/enums/match-stage.enum';
export class TournamentScheduleResponseDto {
  @ApiProperty({
    description: '토너먼트 일정',
  })
  games: TournamentGameDto[];
}

export class TournamentGameDto {
  @ApiProperty({
    description: '경기 ID',
    example: 1,
  })
  gameId: number;
  @ApiProperty({
    description: '홈팀',
    example: {
      id: 1,
      name: '홈팀',
      score: 4,
    },
  })
  homeTeam: TeamSummaryDto;
  @ApiProperty({
    description: '원정팀',
    example: {
      id: 2,
      name: '원정팀',
      score: 0,
    },
  })
  awayTeam: TeamSummaryDto;

  @ApiProperty({
    description: '승자 팀 ID',
    example: 1,
  })
  winnerTeamId: number | null;

  @ApiProperty({
    description: '브래킷 위치',
    example: BracketPosition.SF_1,
  })
  bracketPosition: BracketPosition | null;
}
