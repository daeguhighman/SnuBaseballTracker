import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { GroupedTeamResponseDto } from './dtos/team.dto';
import { BasePlayerListResponseDto } from '@players/dtos/player.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('grouped')
  @ApiOperation({ summary: '팀 그룹 조회' })
  @ApiResponse({
    status: 200,
    description: '팀 그룹 조회 성공',
    type: GroupedTeamResponseDto,
    example: {
      A: [
        {
          id: 1,
          name: '팀 A',
          games: 4,
          wins: 3,
          draws: 1,
          losses: 0,
          rank: 1,
        },
        {
          id: 2,
          name: '팀 B',
          games: 4,
          wins: 3,
          draws: 1,
          losses: 0,
          rank: 1,
        },
      ],
      B: [
        {
          id: 3,
          name: '팀 C',
          games: 4,
          wins: 3,
          draws: 1,
          losses: 0,
          rank: 1,
        },
        {
          id: 4,
          name: '팀 D',
          games: 4,
          wins: 2,
          draws: 0,
          losses: 2,
          rank: 2,
        },
      ],
    },
  })
  async getGroupedTeams(): Promise<GroupedTeamResponseDto> {
    return this.teamsService.getGroupedTeams();
  }

  @Get(':teamId/players')
  @ApiOperation({ summary: '팀 선수 조회' })
  @ApiResponse({
    status: 200,
    description: '팀 선수 조회 성공',
    type: BasePlayerListResponseDto,
  })
  async getTeamPlayers(
    @Param('teamId', ParseIntPipe) teamId: number,
  ): Promise<BasePlayerListResponseDto> {
    return this.teamsService.getTeamPlayers(teamId);
  }
}
