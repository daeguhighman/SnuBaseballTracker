import { Game } from '@games/entities/game.entity';
import {
  GameDto,
  GameScheduleResponseDto,
  GamesByDatesResponseDto,
} from '@games/dtos/game.dto';
import { GameStatus } from '@common/enums/game-status.enum';
import { MatchStage } from '@common/enums/match-stage.enum';
import { DateUtils } from '@common/utils/date.utils';

export function mapGameToDto(
  game: Game,
  permissions?: {
    canRecord: boolean;
    canSubmitLineup: { home: boolean; away: boolean };
  },
): GameDto {
  // 시간도 KST 기준으로 포맷
  const kstTime = game.startTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  }); // e.g. '14:30'

  return {
    gameId: game.id,
    time: kstTime,
    status: game.status as GameStatus,
    stage: game.stage as MatchStage,
    winnerTeamId: game.winnerTeamId ?? null,
    inning: game.gameStat?.inning ?? null,
    inningHalf: game.gameStat?.inningHalf ?? null,
    homeTeam: {
      id: game.homeTeamId ?? null,
      name: game.homeTeam?.name ?? null,
      score: game.gameStat?.homeScore ?? null,
    },
    awayTeam: {
      id: game.awayTeamId ?? null,
      name: game.awayTeam?.name ?? null,
      score: game.gameStat?.awayScore ?? null,
    },
    isForfeit: game.isForfeit,
    canRecord: permissions?.canRecord ?? false,
    canSubmitLineup: permissions?.canSubmitLineup ?? {
      home: false,
      away: false,
    },
  };
}

export function mapGameScheduleToDto(
  date: string,
  gameList: GameDto[], // Game[] -> GameDto[]로 변경
): GameScheduleResponseDto {
  return {
    date,
    dayOfWeek: DateUtils.getKstDayOfWeek(new Date(`${date}T00:00:00+09:00`)),
    games: gameList, // 이미 GameDto[]이므로 map() 불필요
  };
}

export function mapGamesByDatesToDto(
  startDateTime: Date,
  endDateTime: Date,
  groupedGames: Record<string, GameDto[]>, // Game[] -> GameDto[]로 변경
): GamesByDatesResponseDto {
  return {
    range: {
      from: DateUtils.formatKst(startDateTime),
      to: DateUtils.formatKst(endDateTime),
    },
    days: Object.entries(groupedGames).map(([date, gameList]) =>
      mapGameScheduleToDto(date, gameList),
    ),
  };
}
