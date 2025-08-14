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
import { GameInningStat } from '../entities/game-inning-stat.entity';
import { VirtualInningStat } from '../entities/virtual-inning-stat.entity';
import { Play } from '@/plays/entities/play.entity';
import { PlayStatus } from '@/plays/entities/play.entity';
import { GameCoreService } from './game-core.service';
import { GameStatsService } from './game-stats.service';
import { Runner } from '@/plays/entities/runner.entity';

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
    private readonly gameCoreService: GameCoreService,
    private readonly gameStatsService: GameStatsService,
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
      order: { player: { name: 'ASC' } },
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

    // 현재 활성화된 타자들 조회 (타순 순으로 정렬)
    const activeBatters = await this.batterGameParticipationRepository.find({
      where: {
        game: { id: gameId },
        teamTournament: { id: teamTournament.team.id },
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
          teamTournament: { id: teamTournament.team.id },
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
        teamTournamentId: teamTournament.id,
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
          teamTournament: { id: player.teamTournament.id },
          playerTournament: { id: batter.id },
        });
        await manager.save(GameRoaster, gameRoaster);

        const entity = manager.create(BatterGameParticipation, {
          game: { id: gameId },
          teamTournament: { id: player.teamTournament.id },
          playerTournament: { id: batter.id },
          position: batter.position as Position,
          battingOrder: batter.battingOrder,
          substitutionOrder: 0,
          isActive: true,
        });

        const savedEntity = await manager.save(BatterGameParticipation, entity);

        const batterGameStat = manager.create(BatterGameStat, {
          batterGameParticipation: savedEntity,
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
          teamTournament: { id: pitcherPlayer.teamTournament.id },
          playerTournament: { id: pitcherPlayerId },
        });
        await manager.save(GameRoaster, gameRoaster);
      }
      const pitcherEntity = manager.create(PitcherGameParticipation, {
        game: { id: gameId },
        teamTournament: { id: pitcherPlayer.teamTournament.id },
        playerTournament: { id: pitcherPlayerId },
        substitutionOrder: 0,
        isActive: true,
      });
      const savedPitcherEntity = await manager.save(
        PitcherGameParticipation,
        pitcherEntity,
      );

      const pitcherGameStat = manager.create(PitcherGameStat, {
        pitcherGameParticipation: savedPitcherEntity,
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
          playerTournament.id,
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
            teamTournament: { id: player.teamTournamentId },
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
          teamTournament: { id: player.teamTournamentId },
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
      order: { player: { name: 'ASC' } },
    });

    // 2. 현재 라인업에 있는 선수들 조회
    const [activeBatters, activePitcher] = await Promise.all([
      this.batterGameParticipationRepository.find({
        where: {
          game: { id: gameId },
          teamTournament: { id: team.id },
          isActive: true,
        },
        relations: ['playerTournament'],
      }),
      this.pitcherGameParticipationRepository.findOne({
        where: {
          game: { id: gameId },
          teamTournament: { id: team.id },
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
        teamTournament: { id: team.id },
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
  ): Promise<{ success: boolean; message: string; snapshot: any }> {
    let snapshot: any = null;
    let currentPlayId: number | null = null;

    await this.dataSource.transaction(async (manager) => {
      // 0) 필수 엔티티 조회
      const game = await manager.findOne(Game, {
        where: { id: gameId },
        relations: ['homeTeam', 'awayTeam', 'gameStat'],
        // 필요시: lock: { mode: 'pessimistic_write' },
      });
      if (!game) {
        throw new BaseException(
          `게임 ID ${gameId}를 찾을 수 없습니다.`,
          ErrorCodes.GAME_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

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
        teamTournamentId: teamTournament.id,
      });

      // 1) 기존 라인업 조회
      const [existingBatters, existingPitcher] = await Promise.all([
        manager.find(BatterGameParticipation, {
          where: {
            gameId,
            teamTournament: { id: teamTournament.id },
            isActive: true,
          },
          relations: ['playerTournament'],
        }),
        manager.findOne(PitcherGameParticipation, {
          where: {
            gameId,
            teamTournament: { id: teamTournament.id },
            isActive: true,
          },
          relations: ['playerTournament'],
        }),
      ]);

      const isHome = Number(game.homeTeam.id) === Number(teamTournament.id);

      const currentBatterParticipationId = isHome
        ? game.gameStat.homeBatterParticipationId
        : game.gameStat.awayBatterParticipationId;

      const currentPitcherParticipationId = isHome
        ? game.gameStat.homePitcherParticipationId
        : game.gameStat.awayPitcherParticipationId;

      // 2) 타자 교체 비교/적용
      const updatedBatterId = await this.updateBatters(
        manager,
        gameId,
        teamTournament.id,
        submitLineupDto.batters,
        existingBatters,
        currentBatterParticipationId ?? null,
      );

      // 3) 투수 교체 비교/적용
      const updatedPitcherId = await this.updatePitcher(
        manager,
        gameId,
        teamTournament.id,
        submitLineupDto.pitcher,
        existingPitcher ?? null,
        currentPitcherParticipationId ?? null,
      );

      // 4) GameStat 업데이트 (부분 업데이트만!)
      if (game.gameStat) {
        const gsPatch: Partial<GameStat> = {};

        if (isHome) {
          if (updatedBatterId !== null)
            gsPatch.homeBatterParticipationId = updatedBatterId;
          if (updatedPitcherId !== null)
            gsPatch.homePitcherParticipationId = updatedPitcherId;
        } else {
          if (updatedBatterId !== null)
            gsPatch.awayBatterParticipationId = updatedBatterId;
          if (updatedPitcherId !== null)
            gsPatch.awayPitcherParticipationId = updatedPitcherId;
        }

        if (Object.keys(gsPatch).length > 0) {
          await manager.update(GameStat, game.gameStat.id, gsPatch);
        }
        // ✅ save(game.gameStat) 금지 — 오래된 메모리 값으로 전체 컬럼 덮어쓰기 방지
      }

      // 5) 현재 진행 중인 플레이 업데이트
      const currentPlay = await manager.findOne(Play, {
        where: { gameId, status: PlayStatus.LIVE },
        order: { seq: 'DESC' },
      });

      if (currentPlay) {
        let needsUpdate = false;

        // 타자가 교체된 경우, 현재 플레이의 타자 교체 필요 여부 확인
        if (updatedBatterId !== null) {
          const currentBatter = existingBatters.find(
            (b) => b.id === currentPlay.batterGpId,
          );
          if (currentBatter && !currentBatter.isActive) {
            currentPlay.batterGpId = updatedBatterId;
            needsUpdate = true;
          }
        }

        // 투수는 교체되면 무조건 반영
        if (updatedPitcherId !== null) {
          currentPlay.pitcherGpId = updatedPitcherId;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await manager.save(currentPlay);
        }

        currentPlayId = currentPlay.id;

        // 6) umpire snapshot 생성 (트랜잭션 내부)
        snapshot = await this.gameStatsService.makePlaySnapshotUmpire(
          gameId,
          currentPlay.id,
          manager,
        );
      }
    });

    // 트랜잭션 외부: 관중용 스냅샷 push
    if (currentPlayId) {
      await this.gameCoreService.pushSnapshotAudience(gameId, currentPlayId);
    }

    if (!snapshot) {
      throw new BaseException(
        `현재 진행 중인 플레이를 찾을 수 없습니다.`,
        ErrorCodes.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      success: true,
      message: '라인업이 업데이트되었습니다.',
      snapshot,
    };
  }

  private async updateBatters(
    manager: EntityManager,
    gameId: number,
    teamTournamentId: number,
    newBatters: SubmitLineupRequestDto['batters'],
    existing: BatterGameParticipation[],
    currentBatterId: number | null,
  ): Promise<number | null> {
    let updatedBatterId: number | null = null;

    for (const newBatter of newBatters) {
      const prev = existing.find(
        (b) => b.battingOrder === newBatter.battingOrder,
      );
      if (!prev) continue;

      // 선수 자체가 변경된 경우 (교체)
      if (prev.playerTournament.id !== newBatter.id) {
        // 기존 비활성화
        prev.isActive = false;
        await manager.save(prev);

        // 새 참여 생성
        const newParticipation = manager.create(BatterGameParticipation, {
          gameId,
          teamTournament: { id: teamTournamentId },
          playerTournament: { id: newBatter.id },
          position: newBatter.position as Position,
          battingOrder: newBatter.battingOrder,
          substitutionOrder: (prev.substitutionOrder ?? 0) + 1, // ✅ null-safe
          isActive: true,
        });
        const saved = await manager.save(newParticipation);

        // 신규 타자 스탯 생성
        const batterGameStat = manager.create(BatterGameStat, {
          batterGameParticipation: saved,
        });
        await manager.save(batterGameStat);

        // 베이스에 있던 주자 교체 처리
        await this.handleRunnerSubstitution(
          manager,
          gameId,
          prev.id,
          newBatter.id,
          teamTournamentId,
        );

        // 현재 타순이 교체 대상이었다면 GameStat용 반환값 설정
        if (currentBatterId !== null && prev.id === currentBatterId) {
          updatedBatterId = saved.id;
        }
      }
      // 선수 동일, 포지션만 변경
      else if (prev.position !== newBatter.position) {
        prev.position = newBatter.position as Position;
        await manager.save(prev);
      }
    }

    return updatedBatterId;
  }

  private async handleRunnerSubstitution(
    manager: EntityManager,
    gameId: number,
    oldBatterParticipationId: number,
    newPlayerTournamentId: number,
    teamTournamentId: number,
  ): Promise<void> {
    // 1) 게임/스탯 조회
    const game = await manager.findOne(Game, {
      where: { id: gameId },
      relations: ['gameStat'],
    });
    if (!game || !game.gameStat) return;

    // 2) 현재 이닝 스탯
    const currentInningStat = await manager.findOne(GameInningStat, {
      where: {
        gameId,
        inning: game.gameStat.inning,
        inningHalf: game.gameStat.inningHalf,
      },
    });
    if (!currentInningStat) return;

    // 3) 교체되는 선수가 현재 활성 주자인지 확인
    const activeRunner = await manager.findOne(Runner, {
      where: {
        runnerGpId: oldBatterParticipationId,
        gameInningStatId: currentInningStat.id,
        isActive: true,
      },
    });
    if (!activeRunner) return;

    // 4) 새로운 대주자의 "활성" 참여 레코드 찾기 (가장 최근 선호)
    const newRunnerParticipation = await manager.findOne(
      BatterGameParticipation,
      {
        where: {
          gameId,
          teamTournament: { id: teamTournamentId },
          playerTournament: { id: newPlayerTournamentId },
          isActive: true, // ✅ 활성만
        },
        order: { id: 'DESC' }, // ✅ 최근 레코드 우선
      },
    );
    if (!newRunnerParticipation) return;

    // 5) 기존 Runner 비활성화
    activeRunner.isActive = false;
    await manager.save(activeRunner);

    // 6) 새 Runner 생성
    const newRunner = manager.create(Runner, {
      runnerGpId: newRunnerParticipation.id,
      responsiblePitcherGpId: activeRunner.responsiblePitcherGpId,
      originPlay: activeRunner.originPlay,
      gameInningStatId: currentInningStat.id,
      isActive: true,
    });
    await manager.save(newRunner);

    // 7) GameStat 베이스 정보 부분 업데이트 (update만 사용)
    const oldId = Number(oldBatterParticipationId);
    const newId = Number(newRunnerParticipation.id);

    const patch: Partial<GameStat> = {};
    if (
      game.gameStat.onFirstGpId &&
      Number(game.gameStat.onFirstGpId) === oldId
    ) {
      patch.onFirstGpId = newId;
    } else if (
      game.gameStat.onSecondGpId &&
      Number(game.gameStat.onSecondGpId) === oldId
    ) {
      patch.onSecondGpId = newId;
    } else if (
      game.gameStat.onThirdGpId &&
      Number(game.gameStat.onThirdGpId) === oldId
    ) {
      patch.onThirdGpId = newId;
    }

    if (Object.keys(patch).length > 0) {
      await manager.update(GameStat, game.gameStat.id, patch);
    }
    // ✅ game.gameStat 객체를 다시 save하지 않음 — 부분 업데이트만 수행
  }

  private async updatePitcher(
    manager: EntityManager,
    gameId: number,
    teamTournamentId: number,
    newPitcher: SubmitLineupRequestDto['pitcher'],
    existingPitcher: PitcherGameParticipation | null,
    currentPitcherId: number | null,
  ): Promise<number | null> {
    // 기존 없음 → 신규 등록
    if (!existingPitcher) {
      const created = manager.create(PitcherGameParticipation, {
        gameId,
        teamTournament: { id: teamTournamentId },
        playerTournament: { id: newPitcher.id },
        substitutionOrder: 0,
        isActive: true,
      });
      const saved = await manager.save(created);

      const pitcherStat = manager.create(PitcherGameStat, {
        pitcherGameParticipation: saved,
      });
      await manager.save(pitcherStat);

      return saved.id; // GameStat에 반영되도록 반환
    }

    // 같은 투수면 변경사항 없음
    if (existingPitcher.playerTournament.id === newPitcher.id) {
      return null; // 교체 아님
    }

    // 투수 교체
    existingPitcher.isActive = false;
    await manager.save(existingPitcher);

    const newParticipation = manager.create(PitcherGameParticipation, {
      gameId,
      teamTournament: { id: teamTournamentId },
      playerTournament: { id: newPitcher.id },
      substitutionOrder: (existingPitcher.substitutionOrder ?? 0) + 1,
      isActive: true,
    });
    const saved = await manager.save(newParticipation);

    const pitcherStat = manager.create(PitcherGameStat, {
      pitcherGameParticipation: saved,
    });
    await manager.save(pitcherStat);

    // 현재 투수였다면 GameStat에 반영되도록 ID 반환
    if (currentPitcherId !== null && existingPitcher.id === currentPitcherId) {
      return saved.id;
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
        teamTournament: { id: teamTournament.id },
      },
      relations: [
        'playerTournament',
        'playerTournament.player',
        'playerTournament.player.department',
      ], // department 관계 추가
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
        where: {
          game: { id: gameId },
          teamTournament: { id: teamTournamentId },
        },
        relations: ['playerTournament.player'], // player → playerTournament.player로 수정
      }),
      this.pitcherGameParticipationRepository.find({
        where: {
          game: { id: gameId },
          teamTournament: { id: teamTournamentId },
        },
        relations: ['playerTournament.player'], // player → playerTournament.player로 수정
      }),
    ]);

    const isBatterActiveMap = this.getActiveMap(batterParticipations);
    const isPitcherActiveMap = this.getActiveMap(pitcherParticipations);

    const playerDtos = roasters.map((roaster) => {
      const batterActive = isBatterActiveMap.get(roaster.playerTournament.id);
      const pitcherActive = isPitcherActiveMap.get(roaster.playerTournament.id);

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
        id: roaster.playerTournament.id,
        name: roaster.playerTournament.player.name,
        department: roaster.playerTournament.player.department.name,
        isElite: roaster.playerTournament.isElite,
        isSubstitutable,
      };
    });

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
