import {
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Body,
  Post,
  Get,
} from '@nestjs/common';
import { UpdatePlayDto } from './dtos/update-play.dto';
import { PlayService } from './play.service';
import { AddRunnerEventsDto } from './dtos/create-runner-events.dto';

@Controller('plays')
export class PlaysController {
  constructor(private readonly playService: PlayService) {}

  @Patch(':playId/result')
  async updatePlay(
    @Param('playId', ParseIntPipe) playId: number,
    @Body() body: UpdatePlayDto,
  ) {
    return this.playService.updatePlay(playId, body);
  }

  @Post(':playId/runner-events')
  addRunnerEvents(
    @Param('playId', ParseIntPipe) playId: number,
    @Body() dto: AddRunnerEventsDto,
  ) {
    return this.playService.addRunnerEvents(playId, dto);
  }
}
