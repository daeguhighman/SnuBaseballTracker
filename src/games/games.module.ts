// src/games/games.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from '@games/entities/game.entity';
import { GameInningStat } from '@games/entities/game-inning-stat.entity';
import { GamesController } from '@games/games.controller';
import { GameStat } from '@/games/entities/game-stat.entity';
import { BatterGameParticipation } from '@games/entities/batter-game-participation.entity';
import { PitcherGameParticipation } from '@games/entities/pitcher-game-participation.entity';
import { BatterGameStat } from '@games/entities/batter-game-stat.entity';
import { PitcherGameStat } from '@games/entities/pitcher-game-stat.entity';
import { PlayersModule } from '@players/players.module';
import { TeamsModule } from '@teams/teams.module';
import { GameLineupService } from '@games/services/game-lineup.service';
import { GameScoreboardService } from '@games/services/game-scoreboard.service';
import { GameCoreService } from '@games/services/game-core.service';
import { GameStatsService } from '@games/services/game-stats.service';
import { GameRoaster } from '@games/entities/game-roaster.entity';
import { UmpiresModule } from '@umpires/umpires.module';
import { TournamentsModule } from '@tournaments/tournaments.module';
import { GameRepository } from './repositories/game.repository';
import { DataSource } from 'typeorm';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Game,
      GameInningStat,
      GameStat,
      BatterGameParticipation,
      BatterGameStat,
      PitcherGameParticipation,
      PitcherGameStat,
      GameRoaster,
    ]),
    PlayersModule,
    TeamsModule,
    UmpiresModule,
    TournamentsModule,
  ],
  controllers: [GamesController],
  providers: [
    GameCoreService,
    GameStatsService,
    GameLineupService,
    GameScoreboardService,
    {
      provide: 'GAME_REPOSITORY', // DI 토큰 이름
      useFactory: GameRepository, // 팩토리 메서드
      inject: [DataSource], // 의존성 주입
    },
  ],
  exports: [TypeOrmModule, GameCoreService, GameScoreboardService],
})
export class GamesModule {}
