// dto/get-games-by-date.query.ts
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetGamesByDateQuery {
  @IsString()
  @IsOptional()
  from: string;

  @IsString()
  @IsOptional()
  to: string;
}
