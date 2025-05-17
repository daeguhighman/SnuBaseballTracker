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
import { UmpireAuthGuard } from '@/umpires/guards/umpire-auth-guard';
import { GameRole } from '@common/enums/game-role.enum';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  BasePlayerListResponseDto,
  PlayerWithLineupListResponseDto,
  PlayerWithSubstitutableListResponseDto,
} from '@/players/dtos/player.dto';
import { GameStat } from '@games/entities/game-stat.entity';
import { TournamentScheduleResponseDto } from './dtos/tournament-schedule.dto';
@ApiTags('games')
@Controller('games')
export class GamesController {
  constructor(
    private readonly gameLineupService: GameLineupService,
    private readonly gameScoreboardService: GameScoreboardService,
    private readonly gameStatsService: GameStatsService,
    private readonly gameCoreService: GameCoreService,
  ) {}

  @Get()
  @ApiOperation({ summary: '경기 일정 조회' })
  @ApiResponse({
    status: 200,
    description: '경기 일정 조회 성공',
    type: GamesByDatesResponseDto,
  })
  async getSchedules(
    @Query() query: GetGamesByDateQuery,
  ): Promise<GamesByDatesResponseDto> {
    const result = await this.gameCoreService.getSchedules(
      query.from,
      query.to,
    );
    return result;
  }

  @Get('bracket-schedule')
  @ApiOperation({ summary: '토너먼트 일정 조회' })
  @ApiResponse({
    status: 200,
    description: '토너먼트 일정 조회 성공',
    type: TournamentScheduleResponseDto,
  })
  async getTournamentSchedule(): Promise<TournamentScheduleResponseDto> {
    return this.gameCoreService.getTournamentSchedule();
  }
  @UseGuards(UmpireAuthGuard)
  @Get(':gameId/players')
  @ApiOperation({ summary: '경기 선수 조회' })
  @ApiResponse({
    status: 200,
    description: '경기 선수 조회 성공',
    type: BasePlayerListResponseDto,
  })
  async getPlayers(
    @Param('gameId') gameId: number,
    @Query('teamType') teamType: 'home' | 'away',
  ): Promise<BasePlayerListResponseDto> {
    return this.gameLineupService.getPlayers(gameId, teamType);
  }

  @Get(':gameId/players-with-in-lineup')
  @ApiOperation({ summary: '경기 선수 조회' })
  @ApiResponse({
    status: 200,
    description: '경기 선수 조회 성공',
    type: PlayerWithLineupListResponseDto,
  })
  @UseGuards(UmpireAuthGuard)
  async getPlayersWithInLineup(
    @Param('gameId') gameId: number,
    @Query('teamType') teamType: 'home' | 'away',
  ): Promise<PlayerWithLineupListResponseDto> {
    return this.gameLineupService.getPlayersWithInLineup(gameId, teamType);
  }
  @Get(':gameId/substitutable-batters')
  @ApiOperation({ summary: '경기 선수 조회' })
  @ApiResponse({
    status: 200,
    description: '경기 선수 조회 성공',
    type: PlayerWithSubstitutableListResponseDto,
  })
  async getSubstitutableBatters(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Query('teamType') teamType: 'home' | 'away',
  ): Promise<PlayerWithSubstitutableListResponseDto> {
    return this.gameLineupService.getTeamRoasterWithSubstitutableStatus(
      gameId,
      teamType,
      GameRole.BATTER,
    );
  }
  @UseGuards(UmpireAuthGuard)
  @Get(':gameId/substitutable-pitchers')
  @ApiOperation({ summary: '경기 선수 조회' })
  @ApiResponse({
    status: 200,
    description: '경기 선수 조회 성공',
    type: PlayerWithSubstitutableListResponseDto,
  })
  async getSubstitutablePitchers(
    @Param('gameId') gameId: number,
    @Query('teamType') teamType: 'home' | 'away',
  ): Promise<PlayerWithSubstitutableListResponseDto> {
    return this.gameLineupService.getTeamRoasterWithSubstitutableStatus(
      gameId,
      teamType,
      GameRole.PITCHER,
    );
  }

  @UseGuards(UmpireAuthGuard)
  @Get(':gameId/lineup')
  @ApiOperation({ summary: '경기 라인업 조회' })
  @ApiResponse({
    status: 200,
    description: '경기 라인업 조회 성공',
    type: LineupResponseDto,
  })
  async getLineup(
    @Param('gameId') gameId: number,
    @Query('teamType') teamType: 'home' | 'away',
  ): Promise<LineupResponseDto> {
    return this.gameLineupService.getLineup(gameId, teamType);
  }
  @UseGuards(UmpireAuthGuard)
  @Post(':gameId/lineup')
  @ApiOperation({ summary: '경기 라인업 제출' })
  @ApiResponse({
    status: 200,
    description: '경기 라인업 제출 성공',
    type: SubmitSubstitutionResponseDto,
  })
  async submitLineup(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Query('teamType') teamType: 'home' | 'away',
    @Body() body: SubmitLineupRequestDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.gameLineupService.submitLineup(gameId, teamType, body);
  }
  @UseGuards(UmpireAuthGuard)
  @Patch(':gameId/lineup')
  @ApiOperation({ summary: '경기 라인업 수정' })
  @ApiResponse({
    status: 200,
    description: '경기 라인업 수정 성공',
    type: SubmitSubstitutionResponseDto,
  })
  async updateLineup(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Query('teamType') teamType: 'home' | 'away',
    @Body() body: SubmitLineupRequestDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.gameLineupService.updateLineup(gameId, teamType, body);
  }

  @UseGuards(UmpireAuthGuard)
  @Post(':gameId/start')
  @ApiOperation({ summary: '경기 시작' })
  @ApiResponse({
    status: 200,
    description: '경기 시작 성공',
    example: {
      success: true,
      message: '경기 시작 성공',
      gameStat: {
        gameId: 1001,
        homeScore: 0,
        awayScore: 0,
        homeHits: 0,
        awayHits: 0,
        inning: 1,
        inningHalf: 'TOP',
        homePitcherParticipationId: 101,
        homeBatterParticipationId: 201,
        awayPitcherParticipationId: 102,
        awayBatterParticipationId: 202,
      },
    },
  })
  async startGame(
    @Param('gameId') gameId: number,
  ): Promise<{ success: boolean; message: string; gameStat: GameStat }> {
    return this.gameCoreService.startGame(gameId);
  }
  @UseGuards(UmpireAuthGuard)
  @Get(':gameId/current-batter')
  @ApiOperation({ summary: '경기 현재 타자 조회' })
  @ApiResponse({
    status: 200,
    description: '경기 현재 타자 조회 성공',
    type: CurrentBatterResponseDto,
  })
  async getCurrentBatter(
    @Param('gameId') gameId: number,
    @Query('teamType') teamType: 'home' | 'away',
  ): Promise<CurrentBatterResponseDto> {
    return this.gameStatsService.getCurrentBatter(gameId, teamType);
  }
  @UseGuards(UmpireAuthGuard)
  @Get(':gameId/current-pitcher')
  @ApiOperation({ summary: '경기 현재 투수 조회' })
  @ApiResponse({
    status: 200,
    description: '경기 현재 투수 조회 성공',
    type: CurrentPitcherResponseDto,
  })
  async getCurrentPitcher(
    @Param('gameId') gameId: number,
    @Query('teamType') teamType: 'home' | 'away',
  ): Promise<CurrentPitcherResponseDto> {
    return this.gameStatsService.getCurrentPitcher(gameId, teamType);
  }
  @UseGuards(UmpireAuthGuard)
  @Post(':gameId/scores')
  @HttpCode(201)
  @ApiOperation({ summary: '경기 점수 생성' })
  @ApiResponse({
    status: 201,
    description: '경기 점수 생성 성공',
    type: ScoreboardResponseDto,
  })
  async createScore(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Body() scoreDto: SimpleScoreRequestDto,
  ): Promise<ScoreboardResponseDto> {
    this.gameScoreboardService.changeInning(gameId);
    return this.gameScoreboardService.createInningStat(gameId, scoreDto);
  }
  @UseGuards(UmpireAuthGuard)
  @Get(':gameId/scores')
  @ApiOperation({ summary: '경기 점수 조회' })
  @ApiResponse({
    status: 200,
    description: '경기 점수 조회 성공',
    type: ScoreboardResponseDto,
  })
  async getScores(
    @Param('gameId', ParseIntPipe) gameId: number,
  ): Promise<ScoreboardResponseDto> {
    return this.gameScoreboardService.getScoreboard(gameId);
  }
  @UseGuards(UmpireAuthGuard)
  @Patch(':gameId/scores/:inning/:inningHalf')
  @ApiOperation({ summary: '경기 점수 수정' })
  @ApiResponse({
    status: 200,
    description: '경기 점수 수정 성공',
    type: ScoreboardResponseDto,
  })
  async updateScore(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Param('inning', ParseIntPipe) inning: number,
    @Param('inningHalf', new ParseEnumPipe(InningHalf)) inningHalf: InningHalf,
    @Body() scoreDto: InningHalfScoreUpdateDto,
  ): Promise<ScoreboardResponseDto> {
    return this.gameScoreboardService.updateInningStat(
      gameId,
      inning,
      inningHalf,
      scoreDto,
    );
  }
  @UseGuards(UmpireAuthGuard)
  @Post(':gameId/plate-appearance')
  @ApiOperation({ summary: '경기 타자 타석 기록' })
  @ApiResponse({
    status: 200,
    description: '경기 타자 타석 기록 성공',
    type: CurrentBatterResponseDto,
  })
  async createPlateAppearance(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Body() body: BatterPlateAppearanceRequestDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.gameStatsService.recordPlateAppearance(gameId, body);
  }
  @UseGuards(UmpireAuthGuard)
  @Post(':gameId/substitution')
  @ApiOperation({ summary: '교체 명단 등록' })
  @ApiResponse({
    status: 200,
    description: '교체 명단 등록 성공',
    type: SubmitSubstitutionResponseDto,
  })
  async submitSubstitution(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Query('teamType') teamType: 'home' | 'away',
    @Body() body: SubmitSubstituteRequestDto,
  ): Promise<{ success: boolean; playerIds: number[] }> {
    return this.gameLineupService.submitSubstitute(gameId, teamType, body);
  }

  @Get(':gameId/results')
  @ApiOperation({ summary: '경기 결과 조회' })
  @ApiResponse({
    status: 200,
    description: '경기 결과 조회 성공',
    type: GameResultsResponseDto,
  })
  async getGameResults(
    @Param('gameId', ParseIntPipe) gameId: number,
  ): Promise<GameResultsResponseDto> {
    return this.gameStatsService.getGameResults(gameId);
  }
  @UseGuards(UmpireAuthGuard)
  @Post(':gameId/results')
  @ApiOperation({ summary: '경기 종료' })
  @ApiResponse({
    status: 200,
    description: '경기 종료 성공',
    example: { success: true, message: '경기 종료 성공' },
  })
  async endGame(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Body() scoreDto: SimpleScoreRequestDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.gameCoreService.endGame(gameId, scoreDto);
  }
  @UseGuards(UmpireAuthGuard)
  @Post(':gameId/results/finalize')
  @ApiOperation({ summary: '경기 확정' })
  @ApiResponse({
    status: 200,
    description: '경기 확정 성공',
    example: { success: true, message: '경기 확정 성공' },
  })
  async finalizeGame(
    @Param('gameId', ParseIntPipe) gameId: number,
  ): Promise<{ success: boolean; message: string }> {
    return this.gameCoreService.finalizeGame(gameId);
  }
  @UseGuards(UmpireAuthGuard)
  @Patch(':gameId/results/batters/:batterGameStatsId')
  @ApiOperation({ summary: '경기 타자 통계 수정' })
  @ApiResponse({
    status: 200,
    description: '경기 타자 통계 수정 성공',
    type: BatterDailyStats,
  })
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
  @ApiOperation({ summary: '경기 투수 통계 수정' })
  @ApiResponse({
    status: 200,
    description: '경기 투수 통계 수정 성공',
    type: PitcherDailyStats,
  })
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
}
