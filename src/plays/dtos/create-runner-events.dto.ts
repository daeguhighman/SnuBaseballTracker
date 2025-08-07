import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { BasePos } from '../entities/runner-event.entity';

export class RunnerEventInput {
  @IsInt()
  @IsPositive()
  runnerId!: number;

  @IsEnum(['B', '1', '2', '3'] as const)
  startBase!: BasePos;

  @IsEnum(['1', '2', '3', 'H', 'O'] as const)
  endBase!: BasePos;

  @IsOptional()
  isActual = true;

  // startBase와 endBase가 같은지 검사하는 메서드
  validateStartEndBase(): boolean {
    return this.startBase !== this.endBase;
  }
}

export class AddRunnerEventsDto {
  @IsEnum(['PREV', 'AFTER'])
  phase: 'PREV' | 'AFTER';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RunnerEventInput)
  actual: RunnerEventInput[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RunnerEventInput)
  @IsOptional()
  virtual?: RunnerEventInput[];
}
