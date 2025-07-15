import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  nickname: string;
}

export class PresignConfirmDto {
  @IsNotEmpty() key!: string; // s3 key returned by presign
}
