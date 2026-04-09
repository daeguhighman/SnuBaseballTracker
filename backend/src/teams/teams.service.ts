import { HttpStatus, Injectable } from '@nestjs/common';
import { Team } from '@teams/entities/team.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '@players/entities/player.entity';
import { TeamTournament } from '@teams/entities/team-tournament.entity';
import { PlayerTournament } from '@players/entities/player-tournament.entity';
import { GroupedTeamResponseDto, TeamDto } from '@teams/dtos/team.dto';
import {
  BasePlayerDto,
  BasePlayerListResponseDto,
} from '@players/dtos/player.dto';
import { BaseException } from '@/common/exceptions/base.exception';
import { ErrorCodes } from '@/common/exceptions/error-codes.enum';
@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(TeamTournament)
    private readonly teamTournamentRepository: Repository<TeamTournament>,
    @InjectRepository(PlayerTournament)
    private readonly playerTournamentRepository: Repository<PlayerTournament>,
  ) {}

  /**
   * 그룹별 팀 순위 조회
   */
  async getGroupedTeams(): Promise<GroupedTeamResponseDto> {
    type Raw = {
      id: number;
      name: string;
      groupName: string;
      games: number;
      wins: number;
      draws: number;
      losses: number;
    };

    const rawTeams: Raw[] = await this.teamTournamentRepository
      .createQueryBuilder('tt') // tt는 alias
      .innerJoin('tt.team', 'team') // team은 alias
      .select([
        'team.id AS id',
        'team.name AS name',
        'tt.group_name AS groupName',
        'tt.games AS games',
        'tt.wins AS wins',
        'tt.draws AS draws',
        'tt.losses AS losses',
      ])
      .orderBy('tt.group_name', 'ASC')
      .addOrderBy('tt.wins', 'DESC')
      .getRawMany();

    // 그룹핑
    const grouped: Record<string, TeamDto[]> = {};
    rawTeams.forEach((t) => {
      grouped[t.groupName] = grouped[t.groupName] || [];
      grouped[t.groupName].push({
        id: t.id,
        name: t.name,
        games: t.games,
        wins: t.wins,
        draws: t.draws,
        losses: t.losses,
        rank: 0,
      });
    });

    // 랭크 부여
    Object.keys(grouped).forEach((group) => {
      grouped[group] = this.assignRankToTeams(grouped[group]);
    });

    return grouped;
  }

  /**
   * 토너먼트별 그룹별 팀 순위 조회
   */
  async getTournamentGroupedTeams(
    tournamentId: number,
  ): Promise<GroupedTeamResponseDto> {
    type Raw = {
      teamTournamentId: number;
      name: string;
      groupName: string;
      games: number;
      wins: number;
      draws: number;
      losses: number;
    };

    const rawTeams: Raw[] = await this.teamTournamentRepository
      .createQueryBuilder('tt') // tt는 alias
      .innerJoin('tt.team', 'team') // team은 alias
      .select([
        'tt.id AS teamTournamentId',
        'team.name AS name',
        'tt.group_name AS groupName',
        'tt.games AS games',
        'tt.wins AS wins',
        'tt.draws AS draws',
        'tt.losses AS losses',
      ])
      .where('tt.tournament_id = :tournamentId', { tournamentId })
      .orderBy('tt.group_name', 'ASC')
      .addOrderBy('tt.wins', 'DESC')
      .getRawMany();

    // 그룹핑
    const grouped: Record<string, TeamDto[]> = {};
    rawTeams.forEach((t) => {
      grouped[t.groupName] = grouped[t.groupName] || [];
      grouped[t.groupName].push({
        id: t.teamTournamentId, // teamTournamentId 사용
        name: t.name,
        games: t.games,
        wins: t.wins,
        draws: t.draws,
        losses: t.losses,
        rank: 0,
      });
    });

    // 랭크 부여
    Object.keys(grouped).forEach((group) => {
      grouped[group] = this.assignRankToTeams(grouped[group]);
    });

    return grouped;
  }

  /**
   * 팀별 선수 목록 조회 (department 포함)
   */
  async getTeamPlayers(teamId: number): Promise<BasePlayerListResponseDto> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: [
        'teamTournaments',
        'teamTournaments.playerTournaments',
        'teamTournaments.playerTournaments.player',
        'teamTournaments.playerTournaments.player.department',
      ],
    });
    if (!team) {
      throw new BaseException(
        `Team with id ${teamId} not found`,
        ErrorCodes.TEAM_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const playersDto: BasePlayerDto[] = team.teamTournaments
      .sort((a, b) =>
        a.playerTournaments[0].player.name.localeCompare(
          b.playerTournaments[0].player.name,
        ),
      )
      .map((tt) => ({
        id: tt.playerTournaments[0].player.id,
        name: tt.playerTournaments[0].player.name,
        department: tt.playerTournaments[0].player.department?.name ?? null,
        isElite: tt.playerTournaments[0].isElite,
        isWc: tt.playerTournaments[0].isWildcard,
      }));

    return {
      id: team.id,
      name: team.name,
      players: playersDto,
    };
  }

  /**
   * 토너먼트별 팀 선수 목록 조회 (playerTournamentId와 teamTournamentId 사용)
   */
  async getTournamentTeamPlayers(
    tournamentId: number,
    teamTournamentId: number,
  ): Promise<BasePlayerListResponseDto> {
    // TeamTournament 조회 및 검증
    const teamTournament = await this.teamTournamentRepository.findOne({
      where: {
        id: teamTournamentId,
        tournamentId: tournamentId,
      },
      relations: [
        'team',
        'playerTournaments',
        'playerTournaments.player',
        'playerTournaments.player.department',
      ],
    });

    if (!teamTournament) {
      throw new BaseException(
        `TeamTournament with id ${teamTournamentId} in tournament ${tournamentId} not found`,
        ErrorCodes.TEAM_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // 선수 목록을 이름순으로 정렬하고 playerTournamentId 사용
    const playersDto: BasePlayerDto[] = teamTournament.playerTournaments
      .sort((a, b) => a.player.name.localeCompare(b.player.name))
      .map((pt) => ({
        id: pt.id, // playerTournamentId 사용
        name: pt.player.name,
        department: pt.player.department?.name ?? null,
        isElite: pt.isElite,
        isWc: pt.isWildcard,
      }));

    return {
      id: teamTournament.id, // teamTournamentId 사용
      name: teamTournament.team.name,
      players: playersDto,
    };
  }

  /**
   * 팀 순위 부여
   */
  private assignRankToTeams(teams: TeamDto[]): TeamDto[] {
    return teams.map((team, index) => ({
      ...team,
      rank: index + 1,
    }));
  }
}
