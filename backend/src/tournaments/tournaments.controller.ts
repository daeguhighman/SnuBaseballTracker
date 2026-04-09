import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TeamsService } from '@teams/teams.service';
import { RecordsService } from '@records/records.service';
import { TournamentsService } from './tournaments.service';
import { GroupedTeamResponseDto } from '@teams/dtos/team.dto';
import { BasePlayerListResponseDto } from '@players/dtos/player.dto';
import {
  BatterRecordsResponse,
  PitcherRecordsResponse,
} from '@records/dtos/player-record.dto';
import { TournamentListResponseDto } from './dtos/tournament.dto';

@ApiTags('tournaments')
@Controller('tournaments')
export class TournamentsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly recordsService: RecordsService,
    private readonly tournamentsService: TournamentsService,
  ) {}

  @Get()
  async getAllTournaments(): Promise<TournamentListResponseDto> {
    return this.tournamentsService.getAllTournaments();
  }

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

  @Get(':tournamentId/records/batters')
  async getTournamentBatterRecords(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
  ): Promise<BatterRecordsResponse> {
    return this.recordsService.getBatterRecords(tournamentId);
  }

  @Get(':tournamentId/records/pitchers')
  async getTournamentPitcherRecords(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
  ): Promise<PitcherRecordsResponse> {
    return this.recordsService.getPitcherRecords(tournamentId);
  }
}
