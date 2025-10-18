import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
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

  @IsIn(['B', '1', '2', '3'])
  startBase!: BasePos;

  @IsIn(['1', '2', '3', 'H', 'O'])
  endBase!: BasePos;

  @IsOptional()
  isActual = true;

  // startBase와 endBase가 둘 다 'B'인 경우만 막는 메서드
  validateStartEndBase(): boolean {
    return !(this.startBase === 'B' && this.endBase === 'B');
  }
}

export class AddRunnerEventsDto {
  @IsIn(['PREV', 'AFTER'])
  phase: 'PREV' | 'AFTER';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RunnerEventInput)
  events: RunnerEventInput[];
}
