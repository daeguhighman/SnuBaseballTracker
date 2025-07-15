import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayService } from './services/play.service';
import { PlaysController } from './controllers/plays.controller';
import { GamesModule } from '@/games/games.module';
import { Play } from './entities/play.entity';
import { RunnerEvent } from './entities/runner-event-entity';
import { GameHistory } from './entities/game-history.entity';
import { Runner } from './entities/runner.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Play, RunnerEvent, GameHistory, Runner]),
    GamesModule,
  ],
  controllers: [PlaysController],
  providers: [PlayService],
})
export class PlaysModule {}
