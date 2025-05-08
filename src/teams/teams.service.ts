import { HttpStatus, Injectable } from '@nestjs/common';
import { Team } from '@teams/entities/team.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '@players/entities/player.entity';
import { TeamTournament } from '@teams/entities/team-tournament.entity';
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
      winningPercentage: number;
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
        `CASE
            WHEN tt.games = 0 THEN 0
            ELSE CAST(tt.wins / (tt.wins + tt.losses) AS DECIMAL(10,5))
            END AS winningPercentage`,
      ])
      .orderBy('tt.group_name', 'ASC')
      .addOrderBy('winningPercentage', 'DESC')
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
        winningPercentage: Number(Number(t.winningPercentage).toFixed(3)),
      });
    });

    // 랭크 부여
    Object.keys(grouped).forEach((group) => {
      grouped[group] = this.assignRankToTeams(grouped[group]);
    });

    return grouped;
  }

  /**
   * 같은 winningPercentage는 동일 랭크, 이후 팀 수만큼 순위 오프셋
   */
  private assignRankToTeams(teams: TeamDto[]): TeamDto[] {
    let currentRank = 1;
    let sameRankCount = 1;
    let prevPercentage = -1;

    return teams.map((team, index) => {
      if (index === 0) {
        prevPercentage = team.winningPercentage;
        return { ...team, rank: currentRank };
      }

      if (team.winningPercentage === prevPercentage) {
        sameRankCount++;
        return { ...team, rank: currentRank };
      } else {
        currentRank += sameRankCount;
        sameRankCount = 1;
        prevPercentage = team.winningPercentage;
        return { ...team, rank: currentRank };
      }
    });
  }

  /**
   * 팀별 선수 목록 조회 (department 포함)
   */
  async getTeamPlayers(teamId: number): Promise<BasePlayerListResponseDto> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['players', 'players.department'],
    });
    if (!team) {
      throw new BaseException(
        `Team with id ${teamId} not found`,
        ErrorCodes.TEAM_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const playersDto: BasePlayerDto[] = team.players
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => ({
        id: p.id,
        name: p.name,
        departmentName: p.department?.name ?? null,
        isElite: p.isElite,
        isWc: p.isWc,
      }));

    return {
      id: team.id,
      name: team.name,
      players: playersDto,
    };
  }
}
