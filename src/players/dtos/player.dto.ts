export class PlayerDto {
  id: number;
  name: string;
  departmentName: string;
  isElite: boolean;
  isWildcard: boolean;
}

export class PlayerListResponseDto {
  id: number;
  name: string;
  players: PlayerDto[];
}
