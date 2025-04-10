import { Controller, Get, Query } from '@nestjs/common';
import {
  BatterRecordsResponse,
  PitcherRecordsResponse,
} from './dtos/player-record.dto';
import { RecordsService } from './records.service';

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get('batters')
  getBatterRecords(
    @Query('limit') limit: number,
  ): Promise<BatterRecordsResponse> {
    return this.recordsService.getBatterRecords(limit);
  }

  @Get('pitchers')
  getPitcherRecords(
    @Query('limit') limit: number,
  ): Promise<PitcherRecordsResponse> {
    return this.recordsService.getPitcherRecords(limit);
  }
}
