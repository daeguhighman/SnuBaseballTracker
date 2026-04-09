// import { Controller, Get } from '@nestjs/common';
// import { ApiTags } from '@nestjs/swagger';
// import { RecordsService } from './records.service';
// import { BatterRecordsResponse, PitcherRecordsResponse } from './dtos/player-record.dto';

// @ApiTags('records')
// @Controller('records')
// export class RecordsController {
//   constructor(private readonly recordsService: RecordsService) {}

//   @Get('batters')
//   getBatterRecords(): Promise<BatterRecordsResponse> {
//     return this.recordsService.getBatterRecords();
//   }

//   @Get('pitchers')
//   getPitcherRecords(): Promise<PitcherRecordsResponse> {
//     return this.recordsService.getPitcherRecords();
//   }
// }
