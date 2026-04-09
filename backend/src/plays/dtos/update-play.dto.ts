import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PlayStatus } from '../entities/play.entity';
import { PlateAppearanceResult } from '@/common/enums/plate-appearance-result.enum';

export class UpdatePlayDto {
  @IsEnum(PlateAppearanceResult)
  resultCode: PlateAppearanceResult;
}
