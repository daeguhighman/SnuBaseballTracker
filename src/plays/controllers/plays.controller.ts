import {
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Body,
  Post,
  Get,
} from '@nestjs/common';
import { UpdatePlayDto } from '@/plays/dtos/update-play-dto';
import { PlayService } from '../services/play.service';
import { AddRunnerEventsDto } from '../dtos/create-runner-events.dto';

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
  async addRunnerEvents(
    @Param('playId', ParseIntPipe) playId: number,
    @Body() body: AddRunnerEventsDto,
  ) {
    return this.playService.addRunnerEvents(playId, body);
  }

  @Post(':playId/rollback')
  async rollbackToPlay(@Param('playId', ParseIntPipe) playId: number) {
    return this.playService.rollbackToPlay(playId);
  }

  @Post(':gameId/undo')
  async undo(@Param('gameId', ParseIntPipe) gameId: number) {
    return this.playService.undo(gameId);
  }

  @Post(':gameId/redo')
  async redo(@Param('gameId', ParseIntPipe) gameId: number) {
    return this.playService.redo(gameId);
  }

  @Get(':gameId/history')
  async getHistory(@Param('gameId', ParseIntPipe) gameId: number) {
    return this.playService.getHistory(gameId);
  }
}
