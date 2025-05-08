import { Controller, Get } from '@nestjs/common';
import {
  BatterRecordsResponse,
  PitcherRecordsResponse,
} from './dtos/player-record.dto';
import { RecordsService } from './records.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('records')
@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get('batters')
  @ApiOperation({ summary: '타자 기록 조회' })
  @ApiResponse({
    status: 200,
    description: '타자 기록 조회 성공',
    type: BatterRecordsResponse,
  })
  getBatterRecords(): Promise<BatterRecordsResponse> {
    return this.recordsService.getBatterRecords();
  }

  @Get('pitchers')
  @ApiOperation({ summary: '투수 기록 조회' })
  @ApiResponse({
    status: 200,
    description: '투수 기록 조회 성공',
    type: PitcherRecordsResponse,
  })
  getPitcherRecords(): Promise<PitcherRecordsResponse> {
    return this.recordsService.getPitcherRecords();
  }
}
