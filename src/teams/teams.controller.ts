import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GroupedTeamResponseDto } from './dtos/team.dto';
import { PlayerListResponseDto } from '@players/dtos/player.dto';

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('grouped')
  @ApiOperation({
    summary: '모든 조의 팀 목록을 조별로 그룹화하고 순위별로 정렬해서 조회',
  })
  @ApiResponse({
    status: 200,
    description: '조별로 그룹화된 팀 목록 반환 (각 조 내부는 순위 순 정렬)',
    type: GroupedTeamResponseDto,
  })
  async getGroupedTeams(): Promise<GroupedTeamResponseDto> {
    return this.teamsService.getGroupedTeams();
  }

  @Get(':teamId/players')
  @ApiOperation({ summary: '특정 팀의 선수 목록 조회' })
  @ApiParam({
    name: 'teamId',
    required: true,
    description: '팀의 ID',
  })
  @ApiResponse({
    status: 200,
    description: '특정 팀의 선수 목록을 성공적으로 가져옴',
    type: PlayerListResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '해당 팀이 존재하지 않는 경우',
  })
  async getTeamPlayers(
    @Param('teamId', ParseIntPipe) teamId: number,
  ): Promise<PlayerListResponseDto> {
    return this.teamsService.getTeamPlayers(teamId);
  }
}
