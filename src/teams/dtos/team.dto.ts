export class TeamDto {
  id: number;
  name: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  rank: number;
}

export class GroupedTeamResponseDto {
  [key: string]: TeamDto[];
}
