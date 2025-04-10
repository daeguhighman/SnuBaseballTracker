import { Injectable, NotFoundException } from '@nestjs/common';
import { Team } from './entities/team.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '@players/entities/player.entity';
import { TeamTournament } from './entities/team-tournament.entity';
import { GroupedTeamResponseDto } from './dtos/team.dto';
import { PlayerListResponseDto } from '@players/dtos/player.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(TeamTournament)
    private readonly teamTournamentRepository: Repository<TeamTournament>,
  ) {}

  async getGroupedTeams(): Promise<GroupedTeamResponseDto> {
    const teamTournaments = await this.teamTournamentRepository.find({
      relations: ['team'],
      order: {
        group: 'ASC',
        rank: 'ASC',
      },
    });

    // 빈 객체 생성
    const groupedTeams: GroupedTeamResponseDto = {};

    teamTournaments.forEach((tt) => {
      // 그룹이 없으면 생성
      if (!groupedTeams[tt.group]) {
        groupedTeams[tt.group] = [];
      }

      groupedTeams[tt.group].push({
        id: tt.team.id,
        name: tt.team.name,
        games: tt.games,
        wins: tt.wins,
        draws: tt.draws,
        losses: tt.losses,
        rank: tt.rank,
      });
    });

    return groupedTeams;
  }
  async getTeamPlayers(teamId: number): Promise<PlayerListResponseDto> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    const players = await this.playerRepository.find({
      where: { team: { id: teamId } },
      relations: ['department'],
      order: { name: 'ASC' },
    });

    return {
      id: team.id,
      name: team.name,
      players: players.map((player) => ({
        id: player.id,
        name: player.name,
        departmentName: player.department.name,
        isElite: player.isElite,
        isWildcard: player.isWildcard,
      })),
    };
  }
}
