import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayService } from './play.service';
import { PlaysController } from './plays.controller';
import { GamesModule } from '@/games/games.module';
import { Play } from './entities/play.entity';
import { RunnerEvent } from './entities/runner-event.entity';
import { Runner } from './entities/runner.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Play, RunnerEvent, Runner]),
    forwardRef(() => GamesModule),
  ],
  controllers: [PlaysController],
  providers: [PlayService],
  exports: [TypeOrmModule, PlayService],
})
export class PlaysModule {}
