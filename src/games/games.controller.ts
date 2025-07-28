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
import { InningHalf } from '@common/enums/inning-half.enum';
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
  SimpleScoreRequestDto,
} from '@games/dtos/score.dto';
import {
  BatterDailyStats,
  GameResultsResponseDto,
  PitcherDailyStats,
  UpdateBatterStatsDto,
  UpdatePitcherStatsDto,
} from '@games/dtos/game-result.dto';
import { GameLineupService } from '@games/services/game-lineup.service';
import { GameScoreboardService } from '@games/services/game-scoreboard.service';
import { GameStatsService } from '@games/services/game-stats.service';
import { GameCoreService } from '@games/services/game-core.service';
import { BatterPlateAppearanceRequestDto } from './dtos/plate-appearance.dto';
import { UmpireAuthGuard } from '@/auth/guards/umpire-auth.guard';
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
    const userId = req.user?.id;
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
  // @UseGuards(UmpireAuthGuard)
  @Get(':gameId/teams/:teamTournamentId/players')
  async getPlayers(
    @Param('gameId') gameId: number,
    @Param('teamTournamentId', ParseIntPipe) teamTournamentId: number,
  ): Promise<BasePlayerListResponseDto> {
    return this.gameLineupService.getPlayers(gameId, teamTournamentId);
  }

  @Get(':gameId/teams/:teamTournamentId/players-with-in-lineup')
  // @UseGuards(UmpireAuthGuard)
  async getPlayersWithInLineup(
    @Param('gameId') gameId: number,
    @Param('teamTournamentId', ParseIntPipe) teamTournamentId: number,
  ): Promise<PlayerWithLineupListResponseDto> {
    return this.gameLineupService.getPlayersWithInLineup(
      gameId,
      teamTournamentId,
    );
  }
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
  @UseGuards(UmpireAuthGuard)
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

  @Get(':gameId/teams/:teamTournamentId/lineup')
  async getLineup(
    @Param('gameId') gameId: number,
    @Param('teamTournamentId', ParseIntPipe) teamTournamentId: number,
  ): Promise<LineupResponseDto> {
    return this.gameLineupService.getLineup(gameId, teamTournamentId);
  }
  // @UseGuards(SubmitLineupGuard)
  @Post(':gameId/teams/:teamTournamentId/lineup')
  async submitLineup(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Param('teamTournamentId', ParseIntPipe) teamTournamentId: number,
    @Body() body: SubmitLineupRequestDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.gameLineupService.submitLineup(gameId, teamTournamentId, body);
  }
  @UseGuards(SubmitLineupGuard)
  @Patch(':gameId/teams/:teamTournamentId/lineup')
  async updateLineup(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Param('teamTournamentId', ParseIntPipe) teamTournamentId: number,
    @Body() body: SubmitLineupRequestDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.gameLineupService.updateLineup(gameId, teamTournamentId, body);
  }

  // @UseGuards(UmpireAuthGuard)
  @Post(':gameId/start')
  async startGame(
    @Param('gameId') gameId: number,
  ): Promise<{ success: boolean; message: string; snapshot: any }> {
    return this.gameCoreService.startGame(gameId);
  }
  // @UseGuards(UmpireAuthGuard)
  // @Get(':gameId/current-batter')

  // async getCurrentBatter(
  //   @Param('gameId') gameId: number,
  //   @Query('teamType') teamType: 'home' | 'away',
  // ): Promise<CurrentBatterResponseDto> {
  //   return this.gameStatsService.getCurrentBatter(gameId, teamType);
  // }
  // @UseGuards(UmpireAuthGuard)
  // @Get(':gameId/current-pitcher')

  // async getCurrentPitcher(
  //   @Param('gameId') gameId: number,
  //   @Query('teamType') teamType: 'home' | 'away',
  // ): Promise<CurrentPitcherResponseDto> {
  //   return this.gameStatsService.getCurrentPitcher(gameId, teamType);
  // }
  // @UseGuards(UmpireAuthGuard)
  // @Post(':gameId/scores')
  // @HttpCode(201)

  // async createScore(
  //   @Param('gameId', ParseIntPipe) gameId: number,
  //   @Body() scoreDto: SimpleScoreRequestDto,
  // ): Promise<ScoreboardResponseDto> {
  //   this.gameScoreboardService.changeInning(gameId);
  //   return this.gameScoreboardService.createInningStat(gameId, scoreDto);
  // }
  // @UseGuards(UmpireAuthGuard)
  // @Get(':gameId/scores')
  // async getScores(
  //   @Param('gameId', ParseIntPipe) gameId: number,
  // ): Promise<ScoreboardResponseDto> {
  //   return this.gameScoreboardService.getScoreboard(gameId);
  // }
  // @UseGuards(UmpireAuthGuard)
  // @Patch(':gameId/scores/:inning/:inningHalf')

  // async updateScore(
  //   @Param('gameId', ParseIntPipe) gameId: number,
  //   @Param('inning', ParseIntPipe) inning: number,
  //   @Param('inningHalf', new ParseEnumPipe(InningHalf)) inningHalf: InningHalf,
  //   @Body() scoreDto: InningHalfScoreUpdateDto,
  // ): Promise<ScoreboardResponseDto> {
  //   return this.gameScoreboardService.updateInningStat(
  //     gameId,
  //     inning,
  //     inningHalf,
  //     scoreDto,
  //   );
  // }
  // @UseGuards(UmpireAuthGuard)
  // @Post(':gameId/plate-appearance')

  // async createPlateAppearance(
  //   @Param('gameId', ParseIntPipe) gameId: number,
  //   @Body() body: BatterPlateAppearanceRequestDto,
  // ): Promise<{ success: boolean; message: string }> {
  //   return this.gameStatsService.recordPlateAppearance(gameId, body);
  // }
  @UseGuards(SubmitLineupGuard)
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

  @Get(':gameId/results')
  async getGameResults(
    @Param('gameId', ParseIntPipe) gameId: number,
  ): Promise<GameResultsResponseDto> {
    return this.gameStatsService.getGameResults(gameId);
  }
  @UseGuards(UmpireAuthGuard)
  @Post(':gameId/results')
  async endGame(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Body() scoreDto: SimpleScoreRequestDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.gameCoreService.endGame(gameId, scoreDto);
  }
  @UseGuards(UmpireAuthGuard)
  @Post(':gameId/results/finalize')
  async finalizeGame(
    @Param('gameId', ParseIntPipe) gameId: number,
  ): Promise<{ success: boolean; message: string }> {
    return this.gameCoreService.finalizeGame(gameId);
  }
  @UseGuards(UmpireAuthGuard)
  @Patch(':gameId/results/batters/:batterGameStatsId')
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
  @UseGuards(UmpireAuthGuard)
  @Patch(':gameId/results/pitchers/:pitcherGameStatsId')
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
}
