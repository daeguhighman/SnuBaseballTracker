import {
  Controller,
  Get,
  Query,
  NotFoundException,
  Param,
  Patch,
  Post,
  Body,
  ParseIntPipe,
  ParseEnumPipe,
  UseGuards,
  HttpStatus,
  HttpCode,
  Sse,
  MessageEvent,
  Request,
} from '@nestjs/common';
import { GamesByDatesResponseDto } from '@games/dtos/game.dto';
import { GetGamesByDateQuery } from '@games/dtos/game-request.dto';
import {
  SubmitLineupRequestDto,
  SubmitSubstituteRequestDto,
  LineupResponseDto,
  SubmitSubstitutionResponseDto,
} from '@games/dtos/lineup.dto';
import {
  CurrentBatterResponseDto,
  CurrentPitcherResponseDto,
} from '@games/dtos/current-player.dto';
import {
  InningHalfScoreUpdateDto,
  ScoreboardResponseDto,
} from '@games/dtos/score.dto';
import {
  BatterDailyStats,
  GameResultResponseDto,
  PitcherDailyStats,
  UpdateBatterStatsDto,
  UpdatePitcherStatsDto,
} from '@games/dtos/game-result.dto';
import { GameLineupService } from '@games/services/game-lineup.service';
import { GameScoreboardService } from '@games/services/game-scoreboard.service';
import { GameStatsService } from '@games/services/game-stats.service';
import { GameCoreService } from '@games/services/game-core.service';
import { BatterPlateAppearanceRequestDto } from './dtos/plate-appearance.dto';
// import { UmpireAuthGuard } from '@/auth/guards/umpire-auth.guard';
import { SubmitLineupGuard } from '@/auth/guards/submit-lineup.guard';
import { GameRole } from '@common/enums/game-role.enum';
import {
  BasePlayerListResponseDto,
  PlayerWithLineupListResponseDto,
  PlayerWithSubstitutableListResponseDto,
} from '@/players/dtos/player.dto';
import { GameStat } from '@games/entities/game-stat.entity';
import { TournamentScheduleResponseDto } from './dtos/tournament-schedule.dto';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AdminAuthGuard } from '@/auth/guards/admin-auth.guard';

@Controller('games')
export class GamesController {
  constructor(
    private readonly gameLineupService: GameLineupService,
    private readonly gameScoreboardService: GameScoreboardService,
    private readonly gameStatsService: GameStatsService,
    private readonly gameCoreService: GameCoreService,
  ) {}

  @Get()
  async getSchedules(
    @Query() query: GetGamesByDateQuery,
    @Request() req: any,
  ): Promise<GamesByDatesResponseDto> {
    const userId = req.user?.userId;
    const result = await this.gameCoreService.getSchedules(
      query.from,
      query.to,
      userId,
    );
    return result;
  }

  @Get('bracket-schedule')
  async getTournamentSchedule(): Promise<TournamentScheduleResponseDto> {
    return this.gameCoreService.getTournamentSchedule();
  }
  @UseGuards(AdminAuthGuard)
  @Get(':gameId/teams/:teamTournamentId/players')
  async getPlayers(
    @Param('gameId') gameId: number,
    @Param('teamTournamentId', ParseIntPipe) teamTournamentId: number,
  ): Promise<BasePlayerListResponseDto> {
    return this.gameLineupService.getPlayers(gameId, teamTournamentId);
  }

  @UseGuards(AdminAuthGuard)
  @Get(':gameId/teams/:teamTournamentId/players-with-in-lineup')
  async getPlayersWithInLineup(
    @Param('gameId') gameId: number,
    @Param('teamTournamentId', ParseIntPipe) teamTournamentId: number,
  ): Promise<PlayerWithLineupListResponseDto> {
    return this.gameLineupService.getPlayersWithInLineup(
      gameId,
      teamTournamentId,
    );
  }
  @UseGuards(AdminAuthGuard)
  @Get(':gameId/teams/:teamTournamentId/substitutable-batters')
  async getSubstitutableBatters(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Param('teamTournamentId', ParseIntPipe) teamTournamentId: number,
  ): Promise<PlayerWithSubstitutableListResponseDto> {
    return this.gameLineupService.getTeamRoasterWithSubstitutableStatus(
      gameId,
      teamTournamentId,
      GameRole.BATTER,
    );
  }
  @UseGuards(AdminAuthGuard)
  @Get(':gameId/teams/:teamTournamentId/substitutable-pitchers')
  async getSubstitutablePitchers(
    @Param('gameId') gameId: number,
    @Param('teamTournamentId', ParseIntPipe) teamTournamentId: number,
  ): Promise<PlayerWithSubstitutableListResponseDto> {
    return this.gameLineupService.getTeamRoasterWithSubstitutableStatus(
      gameId,
      teamTournamentId,
      GameRole.PITCHER,
    );
  }
  @UseGuards(AdminAuthGuard)
  @Get(':gameId/teams/:teamTournamentId/lineup')
  async getLineup(
    @Param('gameId') gameId: number,
    @Param('teamTournamentId', ParseIntPipe) teamTournamentId: number,
  ): Promise<LineupResponseDto> {
    return this.gameLineupService.getLineup(gameId, teamTournamentId);
  }
  @UseGuards(AdminAuthGuard)
  @Post(':gameId/teams/:teamTournamentId/lineup')
  async submitLineup(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Param('teamTournamentId', ParseIntPipe) teamTournamentId: number,
    @Body() body: SubmitLineupRequestDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.gameLineupService.submitLineup(gameId, teamTournamentId, body);
  }
  @UseGuards(AdminAuthGuard)
  @Patch(':gameId/teams/:teamTournamentId/lineup')
  async updateLineup(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Param('teamTournamentId', ParseIntPipe) teamTournamentId: number,
    @Body() body: SubmitLineupRequestDto,
  ): Promise<{ success: boolean; message: string; snapshot: any }> {
    return this.gameLineupService.updateLineup(gameId, teamTournamentId, body);
  }

  @UseGuards(AdminAuthGuard)
  @Post(':gameId/start')
  async startGame(
    @Param('gameId') gameId: number,
  ): Promise<{ success: boolean; message: string; snapshot: any }> {
    return this.gameCoreService.startGame(gameId);
  }

  @UseGuards(AdminAuthGuard)
  @Post(':gameId/teams/:teamTournamentId/substitution')
  async submitSubstitution(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Param('teamTournamentId', ParseIntPipe) teamTournamentId: number,
    @Body() body: SubmitSubstituteRequestDto,
  ): Promise<{ success: boolean; playerIds: number[] }> {
    return this.gameLineupService.submitSubstitute(
      gameId,
      teamTournamentId,
      body,
    );
  }

  @Get(':gameId/result')
  async getGameResult(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Request() req: any,
  ): Promise<GameResultResponseDto> {
    return this.gameStatsService.getGameResult(gameId, req.user);
  }
  @UseGuards(AdminAuthGuard)
  @Post(':gameId/result')
  async endGame(
    @Param('gameId', ParseIntPipe) gameId: number,
  ): Promise<{ success: boolean; message: string }> {
    return this.gameCoreService.finalizeGame(gameId);
  }

  @UseGuards(AdminAuthGuard)
  @Patch(':gameId/result/batters/:batterGameStatsId')
  async updateBatterStats(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Param('batterGameStatsId', ParseIntPipe) batterGameStatsId: number,
    @Body() updateDto: UpdateBatterStatsDto,
  ): Promise<BatterDailyStats> {
    return this.gameStatsService.updateBatterGameStats(
      gameId,
      batterGameStatsId,
      updateDto,
    );
  }
  @UseGuards(AdminAuthGuard)
  @Patch(':gameId/result/pitchers/:pitcherGameStatsId')
  async updatePitcherStats(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Param('pitcherGameStatsId', ParseIntPipe) pitcherGameStatsId: number,
    @Body() updateDto: UpdatePitcherStatsDto,
  ): Promise<PitcherDailyStats> {
    return this.gameStatsService.updatePitcherGameStats(
      gameId,
      pitcherGameStatsId,
      updateDto,
    );
  }

  @Sse(':gameId/snapshot/stream')
  streamSnapshot(
    @Param('gameId', ParseIntPipe) gameId: number,
  ): Observable<MessageEvent> {
    // 서비스 메서드에서 Observable<MessageEvent> 반환하도록 구현 예정
    // getSnapshotStream 내부에서 makePlaySnapshotAudience를 사용해 관중화면용 스냅샷을 push해야 함
    return this.gameCoreService.getSnapshotStream(gameId);
  }

  @Get(':gameId/snapshot/umpire')
  async getLatestUmpireSnapshot(
    @Param('gameId', ParseIntPipe) gameId: number,
  ): Promise<any> {
    return this.gameStatsService.getLatestUmpireSnapshot(gameId);
  }
}
