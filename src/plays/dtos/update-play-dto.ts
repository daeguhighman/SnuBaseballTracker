import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PlayStatus } from '../entities/play.entity';
import { PlateAppearanceResult } from '@/common/enums/plate-appearance-result.enum';

export class UpdatePlayDto {
  /** 삼진·안타 등 타석 종료 결과 */
  @IsOptional()
  @IsEnum(PlateAppearanceResult)
  resultCode?: PlateAppearanceResult;

  /** COMPLETE | ABANDONED */
  @IsOptional()
  @IsEnum(PlayStatus)
  status?: PlayStatus;

  // @IsOptional()
  // @IsString()
  // comment?: string;
}
