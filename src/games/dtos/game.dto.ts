export enum GameStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  EDITING = 'EDITING',
  CANCELLED = 'CANCELLED',
  FINALIZED = 'FINALIZED',
}

export enum InningHalf {
  TOP = 'TOP',
  BOT = 'BOT',
}

export class TeamSummaryDto {
  id: number;
  name: string;
  score: number | null;
}

export class GameDto {
  time: string;
  status: GameStatus;
  currentInning?: number;
  inning_half?: InningHalf;
  homeTeam: TeamSummaryDto;
  awayTeam: TeamSummaryDto;
}

export class GameScheduleResponseDto {
  date: string;
  dayOfWeek: string;
  games: GameDto[];
}
