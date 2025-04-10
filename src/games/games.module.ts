// src/games/games.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { GameInningScore } from './entities/game-inning-score.entity';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { Team } from '@teams/entities/team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Game, GameInningScore, Team])],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
