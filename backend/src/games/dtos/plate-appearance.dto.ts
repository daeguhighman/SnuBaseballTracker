import { PlateAppearanceResult } from '@/common/enums/plate-appearance-result.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
export class BatterPlateAppearanceRequestDto {
  @ApiProperty({
    description: '결과',
    example: PlateAppearanceResult.DOUBLE,
  })
  @IsEnum(PlateAppearanceResult)
  result: PlateAppearanceResult;
}
