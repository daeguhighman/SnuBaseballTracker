import { IsBoolean, IsInt, IsString } from 'class-validator';

export class BasePlayerDto {
  @IsInt()
  id: number; // playerTournamentId
  @IsString()
  name: string;
  @IsString()
  department: string;

  @IsBoolean()
  isElite: boolean;

  @IsBoolean()
  isWc: boolean;
}

export class PlayerWithLineupDto extends BasePlayerDto {
  @IsBoolean()
  inLineup: boolean;
}

export class PlayerWithSubstitutionFlagDto extends BasePlayerDto {
  @IsBoolean()
  isSubstitutable: boolean;
}

export class BasePlayerListResponseDto {
  @IsInt()
  id: number; // teamTournamentId
  @IsString()
  name: string;
  players: BasePlayerDto[];
}
export class PlayerWithLineupListResponseDto {
  @IsInt()
  id: number; // teamTournamentId
  @IsString()
  name: string;
  players: PlayerWithLineupDto[];
}

export class PlayerWithSubstitutableListResponseDto {
  @IsInt()
  id: number; // teamTournamentId
  @IsString()
  name: string;
  players: PlayerWithSubstitutionFlagDto[];
}
