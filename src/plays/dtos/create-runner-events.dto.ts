import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { BasePos } from '../entities/runner-event-entity';

export class RunnerEventInput {
  @IsInt()
  @IsPositive()
  runnerGpId!: number;

  @IsEnum(['B', '1', '2', '3'] as const)
  start!: BasePos;

  @IsEnum(['1', '2', '3', 'H', 'O'] as const)
  end!: BasePos;

  @IsOptional()
  isActual = true;
}

// 타석 중(전) 이벤트와 타석 결과 이벤트를 명확히 분리
export class AddRunnerEventsDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RunnerEventInput)
  prevBatEvents?: RunnerEventInput[]; // 도루, 폭투 등 타석 중 발생

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RunnerEventInput)
  afterBatEvents?: RunnerEventInput[]; // 안타, 볼넷 등 타석 결과로 발생
}
