import {
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Body,
  Post,
  Get,
  UseGuards,
} from '@nestjs/common';
import { UpdatePlayDto } from './dtos/update-play.dto';
import { PlayService } from './play.service';
import { AddRunnerEventsDto } from './dtos/create-runner-events.dto';

import { AdminAuthGuard } from '@/auth/guards/admin-auth.guard';
@Controller('plays')
export class PlaysController {
  constructor(private readonly playService: PlayService) {}

  @UseGuards(AdminAuthGuard)
  @Patch(':playId/result')
  async updatePlay(
    @Param('playId', ParseIntPipe) playId: number,
    @Body() body: UpdatePlayDto,
  ) {
    return this.playService.updatePlay(playId, body);
  }

  @UseGuards(AdminAuthGuard)
  @Post(':playId/runner-events')
  async addRunnerEvents(
    @Param('playId', ParseIntPipe) playId: number,
    @Body() dto: AddRunnerEventsDto,
  ) {
    return this.playService.addRunnerEvents(playId, dto);
  }
}
