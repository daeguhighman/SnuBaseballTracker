import { Controller, Get } from '@nestjs/common';
import {
  BatterRecordsResponse,
  PitcherRecordsResponse,
} from '@records/dtos/player-record.dto';
import { RecordsService } from '@records/records.service';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get('batters')
  getBatterRecords(): Promise<BatterRecordsResponse> {
    return this.recordsService.getBatterRecords();
  }

  @Get('pitchers')
  getPitcherRecords(): Promise<PitcherRecordsResponse> {
    return this.recordsService.getPitcherRecords();
  }
}
