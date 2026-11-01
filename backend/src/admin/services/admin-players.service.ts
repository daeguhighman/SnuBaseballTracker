import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';

import { Player } from '@players/entities/player.entity';
import { PlayerTournament } from '@players/entities/player-tournament.entity';
import { TeamTournament } from '@teams/entities/team-tournament.entity';
import { College } from '@/profiles/entities/college.entity';
import { Department } from '@/profiles/entities/department.entity';

import { RegisterPlayerDto } from '@admin/dtos/admin.dto';

@Injectable()
export class AdminPlayersService {
  constructor(
    @InjectRepository(College)
    private readonly collegeRepo: Repository<College>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(TeamTournament)
    private readonly teamTournamentRepo: Repository<TeamTournament>,
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
    @InjectRepository(PlayerTournament)
    private readonly playerTournamentRepo: Repository<PlayerTournament>,
    private readonly dataSource: DataSource,
  ) {}

  async listColleges() {
    return this.collegeRepo.find({
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });
  }

  async listDepartments() {
    const departments = await this.departmentRepo.find({
      relations: ['college'],
      order: { name: 'ASC' },
    });
    return departments.map((d) => ({
      id: d.id,
      name: d.name,
      collegeId: d.college?.id ?? null,
    }));
  }

  /** 이름으로 기존 선수 찾기 (이전 대회 선수를 다시 등록할 때) */
  async searchPlayers(name: string) {
    const keyword = name?.trim();
    if (!keyword) return [];
    const players = await this.playerRepo.find({
      where: { name: Like(`%${keyword}%`) },
      relations: [
        'college',
        'department',
        'playerTournaments',
        'playerTournaments.teamTournament',
        'playerTournaments.teamTournament.team',
        'playerTournaments.teamTournament.tournament',
      ],
      order: { name: 'ASC' },
      take: 20,
    });
    return players.map((p) => ({
      id: p.id,
      name: p.name,
      studentId: p.studentId,
      college: p.college ? { id: p.college.id, name: p.college.name } : null,
      department: p.department
        ? { id: p.department.id, name: p.department.name }
        : null,
      teams: (p.playerTournaments ?? []).map((pt) => ({
        teamTournamentId: pt.teamTournament?.id,
        tournamentId: pt.teamTournament?.tournament?.id,
        label: `${pt.teamTournament?.tournament?.name ?? ''} ${
          pt.teamTournament?.team?.name ?? ''
        }`.trim(),
      })),
    }));
  }

  async registerPlayer(dto: RegisterPlayerDto) {
    return this.dataSource.transaction(async (manager) => {
      const existingPlayer = dto.playerId
        ? await manager.findOne(Player, {
            where: { id: dto.playerId },
            relations: ['college', 'department'],
          })
        : null;
      if (dto.playerId && !existingPlayer) {
        throw new NotFoundException('선수를 찾을 수 없습니다.');
      }

      const college =
        existingPlayer?.college ??
        (await manager.findOne(College, {
          where: { id: dto.collegeId },
        }));
      if (!college) throw new NotFoundException('대학을 찾을 수 없습니다.');

      const department =
        existingPlayer?.department ??
        (await manager.findOne(Department, {
          where: { id: dto.departmentId },
        }));
      if (!department) throw new NotFoundException('학과를 찾을 수 없습니다.');

      const teamTournament = await manager.findOne(TeamTournament, {
        where: { id: dto.teamTournamentId },
        relations: ['team', 'tournament'],
      });
      if (!teamTournament) {
        throw new NotFoundException('팀-대회 매핑을 찾을 수 없습니다.');
      }
      if (teamTournament.tournament.id !== dto.tournamentId) {
        throw new BadRequestException('해당 대회 소속의 팀이 아닙니다.');
      }

      let player =
        existingPlayer ??
        (await manager.findOne(Player, {
          where: { name: dto.name, studentId: dto.studentId },
        }));
      if (!player) {
        player = manager.create(Player, {
          name: dto.name,
          studentId: dto.studentId,
          college,
          department,
        });
        player = await manager.save(player);
      }

      const existing = await manager.findOne(PlayerTournament, {
        where: {
          playerId: player.id,
          teamTournamentId: teamTournament.id,
        },
      });
      if (existing) {
        throw new ConflictException(
          '이미 해당 팀-대회에 등록된 선수입니다.',
        );
      }

      const playerTournament = manager.create(PlayerTournament, {
        player,
        teamTournament,
        tournamentId: dto.tournamentId,
        isWildcard: dto.isWildcard ?? false,
        isElite: dto.isElite ?? false,
      });
      await manager.save(playerTournament);

      return {
        player: {
          id: player.id,
          name: player.name,
          studentId: player.studentId,
        },
        college: { id: college.id, name: college.name },
        department: { id: department.id, name: department.name },
        team: { id: teamTournament.team.id, name: teamTournament.team.name },
        tournamentId: dto.tournamentId,
        teamTournamentId: teamTournament.id,
        playerTournamentId: playerTournament.id,
        isWildcard: playerTournament.isWildcard,
        isElite: playerTournament.isElite,
      };
    });
  }
}
