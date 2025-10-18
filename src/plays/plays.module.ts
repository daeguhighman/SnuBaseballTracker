import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayService } from './play.service';
import { PlaysController } from './plays.controller';
import { GamesModule } from '@/games/games.module';
import { Play } from './entities/play.entity';
import { RunnerEvent } from './entities/runner-event.entity';
import { Runner } from './entities/runner.entity';
import { Game } from '@/games/entities/game.entity';
import { AdminOrUmpireAuthGuard } from '@/auth/guards/admin-or-umpire-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Play, RunnerEvent, Runner, Game]),
    forwardRef(() => GamesModule),
  ],
  controllers: [PlaysController],
  providers: [PlayService, AdminOrUmpireAuthGuard],
  exports: [TypeOrmModule, PlayService],
})
export class PlaysModule {}
