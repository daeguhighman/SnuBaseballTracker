import {
  Controller,
  Post,
  Body,
  Put,
  Patch,
  HttpCode,
  UsePipes,
  ValidationPipe,
  Param,
} from '@nestjs/common';
import { GameCoreService } from '@games/services/game-core.service';
import {
  ForfeitGameDto,
  UmpireRequestDto,
  UpdateScheduleDto,
} from '@admin/dtos/admin.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('admin')
@Controller('admin')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AdminController {
  constructor(private readonly gameCoreService: GameCoreService) {}

  @Post('assign-umpire')
  @HttpCode(201)
  @ApiOperation({ summary: '심판 할당' })
  @ApiResponse({
    status: 201,
    description: '심판 할당 성공',
  })
  async assignUmpire(@Body() body: UmpireRequestDto) {
    return this.gameCoreService.assignUmpireToGame(body.gameId, body.umpireId);
  }

  @Patch('change-umpire')
  @HttpCode(200)
  @ApiOperation({ summary: '심판 변경' })
  @ApiResponse({
    status: 200,
    description: '심판 변경 성공',
  })
  async changeUmpire(@Body() body: UmpireRequestDto) {
    return this.gameCoreService.changeUmpire(body.gameId, body.umpireId);
  }

  @Patch('update-schedule')
  @HttpCode(200)
  @ApiOperation({ summary: '경기 일정 수정' })
  @ApiResponse({
    status: 200,
    description: '경기 일정 수정 성공',
  })
  async updateSchedule(@Body() body: UpdateScheduleDto) {
    return this.gameCoreService.updateSchedule(body.gameId, body.startTime);
  }

  @Patch('forfeit-game')
  @HttpCode(200)
  @ApiOperation({ summary: '몰수승 처리' })
  @ApiResponse({
    status: 200,
    description: '몰수승 처리 성공',
  })
  async forfeitGame(@Body() body: ForfeitGameDto) {
    return this.gameCoreService.forfeitGame(body.gameId, body.winnerTeamId);
  }

  @Patch('change-phase')
  @HttpCode(200)
  @ApiOperation({ summary: '토너먼트 단계 변경' })
  @ApiResponse({
    status: 200,
    description: '토너먼트 단계 변경 성공',
  })
  async changePhase(@Param('tournamentId') tournamentId: number) {
    return this.gameCoreService.changePhase(tournamentId);
  }
}
