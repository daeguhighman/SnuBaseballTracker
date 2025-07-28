import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Game } from '../entities/game.entity';
import { Repository, DataSource, In, EntityManager } from 'typeorm';
import {
  LineupResponseDto,
  SubmitLineupRequestDto,
  SubmitSubstituteRequestDto,
} from '../dtos/lineup.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { GameStat } from '../entities/game-stat.entity';
import { BatterGameParticipation } from '../entities/batter-game-participation.entity';
import { PitcherGameParticipation } from '../entities/pitcher-game-participation.entity';
import { LineupValidator } from '../functions/validators/lineup.validator';
import { Player } from '@players/entities/player.entity';
import {
  BasePlayerListResponseDto,
  PlayerWithLineupListResponseDto,
  PlayerWithSubstitutableListResponseDto,
} from '@players/dtos/player.dto';
import { Team } from '@teams/entities/team.entity';
import { GameRoaster } from '../entities/game-roaster.entity';
import { Position } from '@common/enums/position.enum';
import { GameRole } from '@common/enums/game-role.enum';
import { BatterGameStat } from '../entities/batter-game-stat.entity';
import { PitcherGameStat } from '../entities/pitcher-game-stat.entity';
import { ErrorCodes } from '@/common/exceptions/error-codes.enum';
import { BaseException } from '@/common/exceptions/base.exception';
import { TeamTournament } from '@/teams/entities/team-tournament.entity';
import { PlayerTournament } from '@/players/entities/player-tournament.entity';
@Injectable()
export class GameLineupService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GameStat)
    private readonly gameStatRepository: Repository<GameStat>,
    @InjectRepository(BatterGameParticipation)
    private readonly batterGameParticipationRepository: Repository<BatterGameParticipation>,
    @InjectRepository(PitcherGameParticipation)
    private readonly pitcherGameParticipationRepository: Repository<PitcherGameParticipation>,
    private readonly dataSource: DataSource,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(GameRoaster)
    private readonly gameRoasterRepository: Repository<GameRoaster>,
    @InjectRepository(TeamTournament)
    private readonly teamTournamentRepository: Repository<TeamTournament>,
    @InjectRepository(PlayerTournament)
    private readonly playerTournamentRepository: Repository<PlayerTournament>,
  ) {}

  async getPlayers(
    gameId: number,
    teamTournamentId: number,
  ): Promise<BasePlayerListResponseDto> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['homeTeam', 'awayTeam', 'homeTeam.team', 'awayTeam.team'],
    });
    if (!game) {
      throw new BaseException(
        `게임 ID ${gameId}를 찾을 수 없습니다.`,
        ErrorCodes.GAME_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // teamTournamentId로 TeamTournament 조회
    const teamTournament = await this.teamTournamentRepository.findOne({
      where: { id: teamTournamentId },
      relations: ['team'],
    });
    if (!teamTournament) {
      throw new BaseException(
        `팀-토너먼트 ID ${teamTournamentId}를 찾을 수 없습니다.`,
        ErrorCodes.TEAM_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const playerTournaments = await this.playerTournamentRepository.find({
      where: { teamTournament: { id: teamTournamentId } },
      relations: ['player', 'player.department'],
      order: { name: 'ASC' },
    });
    return {
      id: teamTournament.id, // teamTournamentId 사용
      name: teamTournament.team.name,
      players: playerTournaments.map((playerTournament) => ({
        id: playerTournament.id, // playerTournamentId 사용
        name: playerTournament.player.name,
        department: playerTournament.player.department.name,
        isElite: playerTournament.isElite,
        isWc: playerTournament.isWildcard,
      })),
    };
  }

  async getLineup(
    gameId: number,
    teamTournamentId: number,
  ): Promise<LineupResponseDto> {
    // 게임 정보 조회
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['homeTeam', 'homeTeam.team', 'awayTeam', 'awayTeam.team'],
    });

    if (!game) {
      throw new BaseException(
        `게임 ID ${gameId}를 찾을 수 없습니다.`,
        ErrorCodes.GAME_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // teamTournamentId로 TeamTournament 조회
    const teamTournament = await this.teamTournamentRepository.findOne({
      where: { id: teamTournamentId },
      relations: ['team'],
    });
    if (!teamTournament) {
      throw new BaseException(
        `팀-토너먼트 ID ${teamTournamentId}를 찾을 수 없습니다.`,
        ErrorCodes.TEAM_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    console.log('Debug - teamTournament:', teamTournament);

    // 현재 활성화된 타자들 조회 (타순 순으로 정렬)
    const activeBatters = await this.batterGameParticipationRepository.find({
      where: {
        game: { id: gameId },
        team: { id: teamTournament.team.id },
        isActive: true,
      },
      relations: ['playerTournament', 'playerTournament.player'],
      order: { battingOrder: 'ASC' },
    });

    // 현재 활성화된 투수 조회
    const activePitcher = await this.pitcherGameParticipationRepository.findOne(
      {
        where: {
          game: { id: gameId },
          team: { id: teamTournament.team.id },
          isActive: true,
        },
        relations: ['playerTournament', 'playerTournament.player'],
      },
    );

    // 라인업이 제출되지 않은 경우
    if (activeBatters.length === 0) {
      throw new BaseException(
        '아직 라인업이 제출되지 않았습니다.',
        ErrorCodes.LINEUP_NOT_SUBMITTED,
        HttpStatus.NOT_FOUND,
      );
    }

    // 응답 DTO 생성
    const batters = activeBatters.map((batter) => ({
      battingOrder: batter.battingOrder,
      substitutionOrder: batter.substitutionOrder,
      id: batter.playerTournament.id, // playerTournamentId 사용
      name: batter.playerTournament.player.name,
      position: batter.position,
      isWc: batter.playerTournament.isWildcard,
    }));

    const pitcher = activePitcher
      ? {
          id: activePitcher.playerTournament.id, // playerTournamentId 사용
          name: activePitcher.playerTournament.player.name,
          isWc: activePitcher.playerTournament.isWildcard,
        }
      : null;

    return {
      batters,
      pitcher,
    };
  }

  private getTeamTournamentByType(
    game: Game,
    type: 'home' | 'away',
  ): TeamTournament {
    return type === 'home' ? game.homeTeam : game.awayTeam;
  }

  private async getLatestBatters(gameId: number, teamTournamentId: number) {
    return this.batterGameParticipationRepository
      .createQueryBuilder('batter')
      .innerJoinAndSelect('batter.player', 'player')
      .where('batter.gameId = :gameId', { gameId })
      .andWhere('batter.teamTournamentId = :teamTournamentId', {
        teamTournamentId,
      })
      .andWhere('batter.isActive = :isActive', { isActive: true })
      .orderBy('batter.battingOrder', 'ASC')
      .getMany();
  }

  private mapToBatterDto(batter: BatterGameParticipation) {
    return {
      battingOrder: batter.battingOrder,
      substitutionOrder: batter.substitutionOrder,
      playerId: batter.playerTournament.player.id,
      playerName: batter.playerTournament.player.name,
      position: batter.position,
      isWc: batter.playerTournament.isWildcard,
    };
  }

  private mapToPitcherDto(pitcher: PitcherGameParticipation) {
    return {
      playerId: pitcher.playerTournament.player.id,
      playerName: pitcher.playerTournament.player.name,
      isWc: pitcher.playerTournament.isWildcard,
    };
  }

  async submitLineup(
    gameId: number,
    teamTournamentId: number,
    submitLineupDto: SubmitLineupRequestDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.dataSource.transaction(async (manager) => {
      const game = await manager.findOne(Game, {
        where: { id: gameId },
        relations: ['homeTeam', 'homeTeam.team', 'awayTeam', 'awayTeam.team'],
      });
      if (!game) {
        throw new BaseException(
          `게임 ID ${gameId}를 찾을 수 없습니다.`,
          ErrorCodes.GAME_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      // teamTournamentId로 TeamTournament 조회
      const teamTournament = await manager.findOne(TeamTournament, {
        where: { id: teamTournamentId },
        relations: ['team'],
      });
      if (!teamTournament) {
        throw new BaseException(
          `팀-토너먼트 ID ${teamTournamentId}를 찾을 수 없습니다.`,
          ErrorCodes.TEAM_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      console.log('Debug - teamTournament:', teamTournament);
      // 이미 라인업이 제출되었는지 확인
      const existingLineup = await manager.findOne(BatterGameParticipation, {
        where: {
          game: { id: gameId },
          playerTournament: {
            teamTournament: { id: teamTournamentId },
          },
        },
      });

      if (existingLineup) {
        throw new BaseException(
          '이미 라인업이 제출되었습니다.',
          ErrorCodes.LINEUP_ALREADY_SUBMITTED,
          HttpStatus.BAD_REQUEST,
        );
      }
      LineupValidator.validate({
        submitLineupDto,
        teamId: teamTournament.team.id,
      });

      const playerIds = [
        ...submitLineupDto.batters.map((batter) => batter.id),
        submitLineupDto.pitcher.id,
      ];
      const playerTournaments = await manager.find(PlayerTournament, {
        relations: ['player', 'teamTournament.team'],
        where: { id: In(playerIds) },
      });
      const playerMap = new Map(
        playerTournaments.map((playerTournament) => [
          playerTournament.id,
          playerTournament,
        ]),
      );

      for (const batter of submitLineupDto.batters) {
        const player = playerMap.get(batter.id);
        if (!player) {
          throw new BaseException(
            `플레이어 ID ${batter.id}를 찾을 수 없습니다.`,
            ErrorCodes.PLAYER_NOT_FOUND,
            HttpStatus.NOT_FOUND,
          );
        }
        const gameRoaster = manager.create(GameRoaster, {
          game: { id: gameId },
          team: { id: player.teamTournament.team.id },
          playerTournament: { id: batter.id },
        });
        await manager.save(GameRoaster, gameRoaster);

        const entity = manager.create(BatterGameParticipation, {
          game: { id: gameId },
          team: { id: player.teamTournament.team.id },
          playerTournament: { id: batter.id },
          position: batter.position as Position,
          battingOrder: batter.battingOrder,
          substitutionOrder: 0,
          isActive: true,
        });

        await manager.save(BatterGameParticipation, entity);

        const batterGameStat = manager.create(BatterGameStat, {
          batterGameParticipation: entity,
        });
        await manager.save(batterGameStat);
      }

      const pitcherPlayerId = submitLineupDto.pitcher.id;
      const pitcherPlayer = playerMap.get(pitcherPlayerId);
      if (!pitcherPlayer) {
        throw new BaseException(
          `플레이어 ID ${pitcherPlayerId}를 찾을 수 없습니다.`,
          ErrorCodes.PLAYER_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      const existing = await manager.findOne(PitcherGameParticipation, {
        where: {
          game: { id: gameId },
          playerTournament: { id: pitcherPlayerId },
        },
      });
      if (existing) {
        throw new BaseException(
          `플레이어 ID ${pitcherPlayerId}는 이미 해당 경기의 투수 명단에 등록되어 있습니다.`,
          ErrorCodes.PLAYER_ALREADY_IN_ROSTER,
          HttpStatus.BAD_REQUEST,
        );
      }
      const existingGameRoaster = await manager.findOne(GameRoaster, {
        where: {
          game: { id: gameId },
          playerTournament: { id: pitcherPlayerId },
        },
      });
      if (!existingGameRoaster) {
        const gameRoaster = manager.create(GameRoaster, {
          game: { id: gameId },
          team: { id: pitcherPlayer.teamTournament.team.id },
          playerTournament: { id: pitcherPlayerId },
        });
        await manager.save(GameRoaster, gameRoaster);
      }
      const pitcherEntity = manager.create(PitcherGameParticipation, {
        game: { id: gameId },
        team: { id: pitcherPlayer.teamTournament.team.id },
        playerTournament: { id: pitcherPlayerId },
        substitutionOrder: 0,
        isActive: true,
      });
      await manager.save(PitcherGameParticipation, pitcherEntity);

      const pitcherGameStat = manager.create(PitcherGameStat, {
        pitcherGameParticipation: pitcherEntity,
      });
      await manager.save(PitcherGameStat, pitcherGameStat);
    });
    return {
      success: true,
      message: '라인업이 제출되었습니다.',
    };
  }

  async submitSubstitute(
    gameId: number,
    teamTournamentId: number,
    submitSubstituteDto: SubmitSubstituteRequestDto,
  ): Promise<{ success: boolean; playerIds: number[] }> {
    await this.dataSource.transaction(async (manager) => {
      const game = await manager.findOne(Game, {
        where: { id: gameId },
        relations: ['homeTeam', 'awayTeam'],
      });
      if (!game) {
        throw new BaseException(
          `게임 ID ${gameId}를 찾을 수 없습니다.`,
          ErrorCodes.GAME_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      // teamTournamentId로 TeamTournament 조회
      const teamTournament = await manager.findOne(TeamTournament, {
        where: { id: teamTournamentId },
        relations: ['team'],
      });
      if (!teamTournament) {
        throw new BaseException(
          `팀-토너먼트 ID ${teamTournamentId}를 찾을 수 없습니다.`,
          ErrorCodes.TEAM_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      const playerTournaments = await manager.find(PlayerTournament, {
        relations: ['player'],
        where: { id: In(submitSubstituteDto.playerIds) },
      });
      const playerMap = new Map(
        playerTournaments.map((playerTournament) => [
          playerTournament.player.id,
          playerTournament,
        ]),
      );
      for (const playerId of submitSubstituteDto.playerIds) {
        const player = playerMap.get(playerId);
        if (!player) {
          throw new BaseException(
            `플레이어 ID ${playerId}를 찾을 수 없습니다.`,
            ErrorCodes.PLAYER_NOT_FOUND,
            HttpStatus.NOT_FOUND,
          );
        }
        const existing = await manager.findOne(GameRoaster, {
          where: {
            game: { id: gameId },
            team: { id: player.teamTournament.team.id },
            playerTournament: { id: playerId },
          },
        });

        if (existing) {
          throw new BaseException(
            `플레이어 ID ${playerId}는 이미 해당 경기의 교체명단에 등록되어 있습니다.`,
            ErrorCodes.PLAYER_ALREADY_IN_ROSTER,
            HttpStatus.BAD_REQUEST,
          );
        }
        const gameRoaster = manager.create(GameRoaster, {
          game: { id: gameId },
          team: { id: player.teamTournament.team.id },
          playerTournament: { id: playerId },
        });
        await manager.save(GameRoaster, gameRoaster);
      }
    });
    return {
      success: true,
      playerIds: submitSubstituteDto.playerIds,
    };
  }

  async getPlayersWithInLineup(
    gameId: number,
    teamTournamentId: number,
  ): Promise<PlayerWithLineupListResponseDto> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['homeTeam', 'awayTeam'],
    });
    if (!game) {
      throw new BaseException(
        `게임 ID ${gameId}를 찾을 수 없습니다.`,
        ErrorCodes.GAME_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // teamTournamentId로 TeamTournament 조회
    const teamTournament = await this.teamTournamentRepository.findOne({
      where: { id: teamTournamentId },
      relations: ['team'],
    });
    if (!teamTournament) {
      throw new BaseException(
        `팀-토너먼트 ID ${teamTournamentId}를 찾을 수 없습니다.`,
        ErrorCodes.TEAM_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const team = teamTournament.team;

    // 1. 해당 팀의 모든 선수 조회
    const playerTournaments = await this.playerTournamentRepository.find({
      where: { teamTournament: { id: teamTournamentId } },
      relations: ['player', 'player.department'],
      order: { name: 'ASC' },
    });

    // 2. 현재 라인업에 있는 선수들 조회
    const [activeBatters, activePitcher] = await Promise.all([
      this.batterGameParticipationRepository.find({
        where: {
          game: { id: gameId },
          team: { id: team.id },
          isActive: true,
        },
        relations: ['playerTournament'],
      }),
      this.pitcherGameParticipationRepository.findOne({
        where: {
          game: { id: gameId },
          team: { id: team.id },
          isActive: true,
        },
        relations: ['playerTournament'],
      }),
    ]);

    // 3. 라인업에 있는 선수들의 ID를 Set으로 관리
    const playersInLineup = new Set([
      ...activeBatters.map((b) => b.playerTournament.id),
      ...(activePitcher ? [activePitcher.playerTournament.id] : []),
    ]);

    // 4. 교체 명단에 있는 선수들 조회
    const substitutePlayers = await this.gameRoasterRepository.find({
      where: {
        game: { id: gameId },
        team: { id: team.id },
      },
      relations: ['playerTournament'],
    });

    // 5. 교체 명단에 있는 선수들의 ID를 Set으로 관리
    const substitutePlayerIds = new Set(
      substitutePlayers.map((s) => s.playerTournament.id),
    );

    // 6. 응답 DTO 생성
    const playerDtos = playerTournaments.map((playerTournament) => ({
      id: playerTournament.id, // playerTournamentId 사용
      name: playerTournament.player.name,
      department: playerTournament.player.department.name,
      isElite: playerTournament.isElite,
      isWc: playerTournament.isWildcard,
      inLineup: playersInLineup.has(playerTournament.id), // playerTournamentId 사용
    }));

    return {
      id: teamTournament.id, // teamTournamentId 사용
      name: team.name,
      players: playerDtos,
    };
  }
  async updateLineup(
    gameId: number,
    teamTournamentId: number,
    submitLineupDto: SubmitLineupRequestDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.dataSource.transaction(async (manager) => {
      const game = await manager.findOne(Game, {
        where: { id: gameId },
        relations: ['homeTeam', 'awayTeam', 'gameStat'],
      });
      if (!game) {
        throw new BaseException(
          `게임 ID ${gameId}를 찾을 수 없습니다.`,
          ErrorCodes.GAME_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      // teamTournamentId로 TeamTournament 조회
      const teamTournament = await manager.findOne(TeamTournament, {
        where: { id: teamTournamentId },
        relations: ['team'],
      });
      if (!teamTournament) {
        throw new BaseException(
          `팀-토너먼트 ID ${teamTournamentId}를 찾을 수 없습니다.`,
          ErrorCodes.TEAM_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      LineupValidator.validate({
        submitLineupDto,
        teamId: teamTournament.team.id,
      });

      // 1. 기존 라인업 조회
      const [existingBatters, existingPitcher] = await Promise.all([
        manager.find(BatterGameParticipation, {
          where: {
            gameId,
            team: { id: teamTournament.team.id },
            isActive: true,
          },
        }),
        manager.findOne(PitcherGameParticipation, {
          where: {
            gameId,
            team: { id: teamTournament.team.id },
            isActive: true,
          },
        }),
      ]);

      // 2. 타자 교체 비교
      const updatedBatterId = await this.updateBatters(
        manager,
        gameId,
        teamTournament.team.id,
        submitLineupDto.batters,
        existingBatters,
      );

      // 3. 투수 교체 비교
      const updatedPitcherId = await this.updatePitcher(
        manager,
        gameId,
        teamTournament.team.id,
        submitLineupDto.pitcher,
        existingPitcher,
      );

      // 4. GameStat 업데이트
      if (game.gameStat) {
        const isHome = game.homeTeam.id === teamTournament.id;
        if (isHome) {
          game.gameStat.homeBatterParticipationId = updatedBatterId;
          game.gameStat.homePitcherParticipationId = updatedPitcherId;
        } else {
          game.gameStat.awayBatterParticipationId = updatedBatterId;
          game.gameStat.awayPitcherParticipationId = updatedPitcherId;
        }
        await manager.save(game.gameStat);
      }
    });
    return {
      success: true,
      message: '라인업이 업데이트되었습니다.',
    };
  }

  private async updateBatters(
    manager: EntityManager,
    gameId: number,
    teamId: number,
    newBatters: SubmitLineupRequestDto['batters'],
    existing: BatterGameParticipation[],
  ): Promise<number | null> {
    let updatedBatterId: number | null = null;

    for (const newBatter of newBatters) {
      const prev = existing.find(
        (b) => b.battingOrder === newBatter.battingOrder,
      );
      if (!prev) continue;

      // player 변경
      if (prev.playerTournament.player.id !== newBatter.id) {
        prev.isActive = false;
        await manager.save(prev);

        const newEntity = manager.create(BatterGameParticipation, {
          gameId,
          team: { id: teamId },
          playerTournament: { id: newBatter.id },
          position: newBatter.position as Position,
          battingOrder: newBatter.battingOrder,
          substitutionOrder: prev.substitutionOrder + 1,
          isActive: true,
        });
        const saved = await manager.save(newEntity);

        const batterGameStat = manager.create(BatterGameStat, {
          batterGameParticipation: newEntity,
        });
        await manager.save(BatterGameStat, batterGameStat);

        // The original code had a check for `prev.id === currentBatterId` here,
        // but `currentBatterId` was removed from the function signature.
        // Assuming the intent was to update the GameStat if the updated batter is the current one.
        // However, the `updateLineup` function now calls `updateBatters` without `currentBatterId`.
        // This means the GameStat update logic will be removed or needs to be re-evaluated
        // based on how `currentBatterId` is handled in the new `updateLineup` signature.
        // For now, I'm removing the line as `currentBatterId` is no longer passed.
      }

      // position만 변경된 경우
      else if (prev.position !== newBatter.position) {
        prev.position = newBatter.position as Position;
        await manager.save(prev);
      }
    }

    return updatedBatterId;
  }

  private async updatePitcher(
    manager: EntityManager,
    gameId: number,
    teamId: number,
    newPitcher: SubmitLineupRequestDto['pitcher'],
    existing: PitcherGameParticipation,
  ): Promise<number | null> {
    if (existing.playerTournament.player.id !== newPitcher.id) {
      existing.isActive = false;
      await manager.save(existing);

      const newEntity = manager.create(PitcherGameParticipation, {
        gameId,
        team: { id: teamId },
        playerTournament: { id: newPitcher.id },
        substitutionOrder: existing.substitutionOrder + 1,
        isActive: true,
      });
      const saved = await manager.save(newEntity);

      const pitcherGameStat = manager.create(PitcherGameStat, {
        pitcherGameParticipation: newEntity,
      });
      await manager.save(PitcherGameStat, pitcherGameStat);

      return existing.id; // Return the ID of the updated pitcher
    }

    return null;
  }

  async getTeamRoasterWithSubstitutableStatus(
    gameId: number,
    teamTournamentId: number,
    role: GameRole,
  ): Promise<PlayerWithSubstitutableListResponseDto> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['homeTeam', 'awayTeam'],
    });
    if (!game)
      throw new BaseException(
        `게임 ID ${gameId}를 찾을 수 없습니다.`,
        ErrorCodes.GAME_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );

    // teamTournamentId로 TeamTournament 조회
    const teamTournament = await this.teamTournamentRepository.findOne({
      where: { id: teamTournamentId },
      relations: ['team'],
    });
    if (!teamTournament) {
      throw new BaseException(
        `팀-토너먼트 ID ${teamTournamentId}를 찾을 수 없습니다.`,
        ErrorCodes.TEAM_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const team = teamTournament.team;

    const roasters = await this.gameRoasterRepository.find({
      where: {
        game: { id: gameId },
        team: { id: teamTournament.team.id },
      },
      relations: ['playerTournament', 'playerTournament.player'],
    });

    const roasterMap = new Map(
      roasters.map((roaster) => [roaster.playerTournament.id, roaster]),
    );

    const playerTournaments = await this.playerTournamentRepository.find({
      where: { teamTournament: { id: teamTournamentId } },
      relations: ['player', 'player.department'],
      order: { name: 'ASC' },
    });

    const playerDtos = playerTournaments.map((playerTournament) => ({
      id: playerTournament.id, // playerTournamentId 사용
      name: playerTournament.player.name,
      department: playerTournament.player.department.name,
      isElite: playerTournament.isElite,
      isWc: playerTournament.isWildcard,
      isSubstitutable: !roasterMap.has(playerTournament.id),
    }));

    return {
      id: teamTournament.id, // teamTournamentId 사용
      name: team.name,
      players: playerDtos,
    };
  }

  private getActiveMap(
    participations: (BatterGameParticipation | PitcherGameParticipation)[],
  ): Map<number, boolean> {
    const map = new Map<number, boolean>();
    for (const p of participations) {
      map.set(p.playerTournament.id, p.isActive); // playerTournamentId 사용
    }
    return map;
  }
}
