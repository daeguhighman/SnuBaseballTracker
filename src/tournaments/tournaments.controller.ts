import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { TeamsService } from '@teams/teams.service';
import { GroupedTeamResponseDto } from '@teams/dtos/team.dto';
import { BasePlayerListResponseDto } from '@players/dtos/player.dto';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get(':tournamentId/teams/grouped')
  async getTournamentGroupedTeams(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
  ): Promise<GroupedTeamResponseDto> {
    return this.teamsService.getTournamentGroupedTeams(tournamentId);
  }

  @Get(':tournamentId/teams/:teamTournamentId/players')
  async getTournamentTeamPlayers(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('teamTournamentId', ParseIntPipe) teamTournamentId: number,
  ): Promise<BasePlayerListResponseDto> {
    return this.teamsService.getTournamentTeamPlayers(
      tournamentId,
      teamTournamentId,
    );
  }
}
