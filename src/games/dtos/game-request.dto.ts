// dto/get-games-by-date.query.ts
import { IsOptional, IsString } from 'class-validator';

export class GetGamesByDateQuery {
  @IsString()
  @IsOptional()
  from: string;

  @IsString()
  @IsOptional()
  to: string;
}
