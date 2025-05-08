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
  ) {}

  async getPlayers(
    gameId: number,
    teamType: 'home' | 'away',
  ): Promise<BasePlayerListResponseDto> {
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
    const team = teamType === 'home' ? game.homeTeam : game.awayTeam;
    const players = await this.playerRepository.find({
      where: { team: { id: team.id } },
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
        isWc: player.isWc,
      })),
    };
  }

  async getLineup(
    gameId: number,
    teamType: 'home' | 'away',
  ): Promise<LineupResponseDto> {
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
    const teamId = this.getTeamIdByType(game, teamType);
    const gameStats = await this.gameStatRepository.findOne({
      where: {
        game: { id: gameId },
      },
    });
    if (!gameStats) {
      throw new BaseException(
        `게임 ID ${gameId}의 게임 스탯을 찾을 수 없습니다.`,
        ErrorCodes.GAME_STAT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const batters = await this.getLatestBatters(gameId, teamId);
    const pitcherId =
      teamType === 'home'
        ? gameStats.homePitcherParticipationId
        : gameStats.awayPitcherParticipationId;

    const pitcher = await this.pitcherGameParticipationRepository.findOne({
      where: {
        id: pitcherId,
      },
      relations: ['player'],
    });
    if (!pitcher) {
      throw new BaseException(
        `게임 ID ${gameId}의 투수를 찾을 수 없습니다.`,
        ErrorCodes.PITCHER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const lineup: LineupResponseDto = {
      batters: batters.map(this.mapToBatterDto),
      pitcher: this.mapToPitcherDto(pitcher),
    };
    return lineup;
  }

  private getTeamIdByType(game: Game, type: 'home' | 'away'): number {
    return type === 'home' ? game.homeTeamId : game.awayTeamId;
  }

  private async getLatestBatters(gameId: number, teamId: number) {
    return this.batterGameParticipationRepository
      .createQueryBuilder('batter')
      .innerJoinAndSelect('batter.player', 'player')
      .where('batter.gameId = :gameId', { gameId })
      .andWhere('batter.teamId = :teamId', { teamId })
      .andWhere('batter.isActive = :isActive', { isActive: true })
      .orderBy('batter.battingOrder', 'ASC')
      .getMany();
  }

  private mapToBatterDto(batter: BatterGameParticipation) {
    return {
      battingOrder: batter.battingOrder,
      substitutionOrder: batter.substitutionOrder,
      playerId: batter.playerId,
      playerName: batter.player.name,
      position: batter.position,
      isWc: batter.player.isWc,
    };
  }

  private mapToPitcherDto(pitcher: PitcherGameParticipation) {
    return {
      playerId: pitcher.playerId,
      playerName: pitcher.player.name,
      isWc: pitcher.player.isWc,
    };
  }

  async submitLineup(
    gameId: number,
    teamType: 'home' | 'away',
    submitLineupDto: SubmitLineupRequestDto,
  ): Promise<{ success: boolean; message: string }> {
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
      const teamId = this.getTeamIdByType(game, teamType);
      // 이미 라인업이 제출되었는지 확인
      const existingLineup = await manager.findOne(BatterGameParticipation, {
        where: { game: { id: gameId }, player: { team: { id: teamId } } },
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
        teamId,
      });

      const playerIds = [
        ...submitLineupDto.batters.map((batter) => batter.playerId),
        submitLineupDto.pitcher.playerId,
      ];
      const players = await manager.find(Player, {
        where: { id: In(playerIds) },
      });
      const playerMap = new Map(players.map((player) => [player.id, player]));

      for (const batter of submitLineupDto.batters) {
        const player = playerMap.get(batter.playerId);
        if (!player) {
          throw new BaseException(
            `플레이어 ID ${batter.playerId}를 찾을 수 없습니다.`,
            ErrorCodes.PLAYER_NOT_FOUND,
            HttpStatus.NOT_FOUND,
          );
        }
        const gameRoaster = manager.create(GameRoaster, {
          game: { id: gameId },
          team: { id: player.teamId },
          player: { id: batter.playerId },
        });
        await manager.save(GameRoaster, gameRoaster);

        const entity = manager.create(BatterGameParticipation, {
          game: { id: gameId },
          team: { id: player.teamId },
          player: { id: batter.playerId },
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

      const pitcherPlayerId = submitLineupDto.pitcher.playerId;
      const pitcherPlayer = playerMap.get(pitcherPlayerId);
      if (!pitcherPlayer) {
        throw new BaseException(
          `플레이어 ID ${pitcherPlayerId}를 찾을 수 없습니다.`,
          ErrorCodes.PLAYER_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      const existing = await manager.findOne(PitcherGameParticipation, {
        where: { game: { id: gameId }, player: { id: pitcherPlayerId } },
      });
      if (existing) {
        throw new BaseException(
          `플레이어 ID ${pitcherPlayerId}는 이미 해당 경기의 투수 명단에 등록되어 있습니다.`,
          ErrorCodes.PLAYER_ALREADY_IN_ROSTER,
          HttpStatus.BAD_REQUEST,
        );
      }
      const existingGameRoaster = await manager.findOne(GameRoaster, {
        where: { game: { id: gameId }, player: { id: pitcherPlayerId } },
      });
      if (!existingGameRoaster) {
        const gameRoaster = manager.create(GameRoaster, {
          game: { id: gameId },
          team: { id: pitcherPlayer.teamId },
          player: { id: pitcherPlayerId },
        });
        await manager.save(GameRoaster, gameRoaster);
      }
      const pitcherEntity = manager.create(PitcherGameParticipation, {
        game: { id: gameId },
        team: { id: pitcherPlayer.teamId },
        player: { id: pitcherPlayerId },
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
    teamType: 'home' | 'away',
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
      const players = await manager.find(Player, {
        where: { id: In(submitSubstituteDto.playerIds) },
      });
      const playerMap = new Map(players.map((player) => [player.id, player]));
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
            team: { id: player.teamId },
            player: { id: playerId },
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
          team: { id: player.teamId },
          player: { id: playerId },
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
    teamType: 'home' | 'away',
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
    const teamId = this.getTeamIdByType(game, teamType);
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
    });
    if (!team) {
      throw new BaseException(
        `팀 ID ${teamId}를 찾을 수 없습니다.`,
        ErrorCodes.TEAM_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    const players = await this.playerRepository.find({
      where: { team: { id: teamId } },
      relations: ['department'],
      order: { name: 'ASC' },
    });

    const [batterParticipations, pitcherParticipations] = await Promise.all([
      this.batterGameParticipationRepository.find({
        where: {
          game: { id: gameId },
          team: { id: teamId },
          isActive: true,
        },
        relations: ['player'],
      }),
      this.pitcherGameParticipationRepository.find({
        where: {
          game: { id: gameId },
          team: { id: teamId },
          isActive: true,
        },
        relations: ['player'],
      }),
    ]);

    // 5. 라인업에 있는 선수 ID Set 생성
    const playersInLineup = new Set([
      ...batterParticipations.map((b) => b.player.id),
      ...pitcherParticipations.map((p) => p.player.id),
    ]);

    // 6. 응답 DTO 생성
    const playerDtos = players.map((player) => ({
      id: player.id,
      name: player.name,
      departmentName: player.department.name,
      isElite: player.isElite,
      isWc: player.isWc,
      inLineup: playersInLineup.has(player.id),
    }));

    return {
      id: teamId,
      name: team.name,
      players: playerDtos,
    };
  }
  async updateLineup(
    gameId: number,
    teamType: 'home' | 'away',
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
      const teamId = this.getTeamIdByType(game, teamType);
      const isHome = teamType === 'home';
      const gameStat = game.gameStat;

      LineupValidator.validate({
        submitLineupDto,
        teamId,
      });

      // 1. 기존 라인업 조회
      const [existingBatters, existingPitcher] = await Promise.all([
        manager.find(BatterGameParticipation, {
          where: { gameId, teamId, isActive: true },
        }),
        manager.findOne(PitcherGameParticipation, {
          where: { gameId, teamId, isActive: true },
        }),
      ]);
      const currentBatterParticipationId = isHome
        ? gameStat.homeBatterParticipationId
        : gameStat.awayBatterParticipationId;
      const currentPitcherParticipationId = isHome
        ? gameStat.homePitcherParticipationId
        : gameStat.awayPitcherParticipationId;
      // 2. 타자 교체 비교
      const updatedBatterId = await this.updateBatters(
        manager,
        gameId,
        teamId,
        submitLineupDto.batters,
        existingBatters,
        currentBatterParticipationId,
      );

      const updatedPitcherId = await this.updatePitcher(
        manager,
        gameId,
        teamId,
        submitLineupDto.pitcher.playerId,
        existingPitcher,
        currentPitcherParticipationId,
      );

      if (updatedBatterId) {
        isHome
          ? (gameStat.homeBatterParticipationId = updatedBatterId)
          : (gameStat.awayBatterParticipationId = updatedBatterId);
      }
      if (updatedPitcherId) {
        isHome
          ? (gameStat.homePitcherParticipationId = updatedPitcherId)
          : (gameStat.awayPitcherParticipationId = updatedPitcherId);
      }
      await manager.save(GameStat, gameStat);
    });
    return {
      success: true,
      message: '라인업이 수정되었습니다.',
    };
  }

  private async updateBatters(
    manager: EntityManager,
    gameId: number,
    teamId: number,
    newBatters: SubmitLineupRequestDto['batters'],
    existing: BatterGameParticipation[],
    currentBatterId: number,
  ): Promise<number | null> {
    let updatedBatterId: number | null = null;

    for (const newBatter of newBatters) {
      const prev = existing.find(
        (b) => b.battingOrder === newBatter.battingOrder,
      );
      if (!prev) continue;

      // player 변경
      if (prev.playerId !== newBatter.playerId) {
        prev.isActive = false;
        await manager.save(prev);

        const newEntity = manager.create(BatterGameParticipation, {
          gameId,
          teamId,
          playerId: newBatter.playerId,
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

        if (prev.id === currentBatterId) {
          updatedBatterId = saved.id;
        }
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
    newPitcherId: number,
    existing: PitcherGameParticipation,
    currentPitcherId: number,
  ): Promise<number | null> {
    if (existing.playerId !== newPitcherId) {
      existing.isActive = false;
      await manager.save(existing);

      const newEntity = manager.create(PitcherGameParticipation, {
        gameId,
        teamId,
        playerId: newPitcherId,
        substitutionOrder: existing.substitutionOrder + 1,
        isActive: true,
      });
      const saved = await manager.save(newEntity);

      const pitcherGameStat = manager.create(PitcherGameStat, {
        pitcherGameParticipation: newEntity,
      });
      await manager.save(PitcherGameStat, pitcherGameStat);

      return existing.id === currentPitcherId ? saved.id : null;
    }

    return null;
  }

  async getTeamRoasterWithSubstitutableStatus(
    gameId: number,
    teamType: 'home' | 'away',
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

    const teamId = teamType === 'home' ? game.homeTeam.id : game.awayTeam.id;
    const team = teamType === 'home' ? game.homeTeam : game.awayTeam;

    const roasters = await this.gameRoasterRepository.find({
      where: {
        game: { id: gameId },
        team: { id: teamId },
      },
      relations: ['player', 'player.department'],
      order: { player: { name: 'ASC' } },
    });

    if (roasters.length === 0) {
      throw new BaseException(
        `등록된 로스터가 없습니다.`,
        ErrorCodes.ROSTER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const [batterParticipations, pitcherParticipations] = await Promise.all([
      this.batterGameParticipationRepository.find({
        where: { game: { id: gameId }, team: { id: teamId } },
        relations: ['player'],
      }),
      this.pitcherGameParticipationRepository.find({
        where: { game: { id: gameId }, team: { id: teamId } },
        relations: ['player'],
      }),
    ]);

    const isBatterActiveMap = this.getActiveMap(batterParticipations);
    const isPitcherActiveMap = this.getActiveMap(pitcherParticipations);

    const playerDtos = roasters.map((roaster) => {
      const batterActive = isBatterActiveMap.get(roaster.player.id);
      const pitcherActive = isPitcherActiveMap.get(roaster.player.id);

      let isSubstitutable = true;
      if (role === GameRole.BATTER) {
        if (batterActive === true) {
          // 이미 라인업에 있음
          isSubstitutable = false;
        } else if (
          (batterActive === false && pitcherActive === undefined) ||
          (pitcherActive === false && batterActive === undefined) ||
          (pitcherActive === false && batterActive === false)
        ) {
          // 경기에서 빠짐
          isSubstitutable = false;
        }
        // undefined(참여한 적 없음)은 교체 가능
      } else if (role === GameRole.PITCHER) {
        if (
          (batterActive === false && pitcherActive === undefined) ||
          (pitcherActive === false && batterActive === undefined) ||
          (pitcherActive === false && batterActive === false)
        ) {
          // 경기에서 빠짐
          isSubstitutable = false;
        }
        // undefined(참여한 적 없음)은 교체 가능
      }

      return {
        id: roaster.player.id,
        name: roaster.player.name,
        departmentName: roaster.player.department.name,
        isElite: roaster.player.isElite,
        isWc: roaster.player.isWc,
        isSubstitutable,
      };
    });

    return {
      id: teamId,
      name: team.name,
      players: playerDtos,
    };
  }

  private getActiveMap(
    participations: (BatterGameParticipation | PitcherGameParticipation)[],
  ): Map<number, boolean> {
    const map = new Map<number, boolean>();
    for (const p of participations) {
      map.set(p.player.id, p.isActive);
    }
    return map;
  }
}
