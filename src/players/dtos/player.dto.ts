import { IsBoolean, IsInt, IsString } from 'class-validator';

export class BasePlayerDto {
  @IsInt()
  id: number;
  @IsString()
  name: string;
  @IsString()
  departmentName: string;
  @IsBoolean()
  isWc: boolean;

  @IsBoolean()
  isElite: boolean;
}

export class PlayerWithLineupDto extends BasePlayerDto {
  inLineup: boolean;
}

export class PlayerWithSubstitutableDto extends BasePlayerDto {
  isSubstitutable: boolean;
}

export class BasePlayerListResponseDto {
  @IsInt()
  id: number;
  @IsString()
  name: string;
  players: BasePlayerDto[];
}
export class PlayerWithLineupListResponseDto {
  @IsInt()
  id: number;
  @IsString()
  name: string;
  players: PlayerWithLineupDto[];
}
export class PlayerWithSubstitutableListResponseDto {
  @IsInt()
  id: number;
  @IsString()
  name: string;
  players: PlayerWithSubstitutableDto[];
}
