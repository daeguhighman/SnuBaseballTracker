import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from '@users/users.controller';
import { TeamsController } from '@teams/teams.controller';
import { TeamsService } from '@teams/teams.service';
import { TeamsModule } from '@teams/teams.module';
import { PlayersModule } from '@players/players.module';
import { Department } from '@players/entities/department.entity';
import { Team } from '@teams/entities/team.entity';
import { Tournament } from '@teams/entities/tournament.entity';
import { TeamTournament } from '@teams/entities/team-tournament.entity';
import { Player } from '@players/entities/player.entity';
import { RecordsController } from '@records/records.controller';
import { RecordsService } from '@records/records.service';
import { RecordsModule } from '@records/records.module';
import { BatterStats } from '@records/entities/batter-stats.entity';
import { PitcherStats } from '@records/entities/pitcher-stats.entity';
import { GamesController } from './games/games.controller';
import { GamesService } from './games/games.service';
import { GamesModule } from './games/games.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'snubaseballtracker-database.cdwua4c225kx.ap-northeast-2.rds.amazonaws.com',
      port: 3306,
      username: 'snubaseball',
      password: 'snubaseball2025',
      database: 'SNUBaseballTracker',
      entities: [__dirname + '/**/*.entity.{ts,js}'],
      synchronize: false, // 마이그레이션 쓴다면 false로 유지!
    }),
    TypeOrmModule.forFeature([
      Team,
      Tournament,
      TeamTournament,
      Player,
      Department,
      BatterStats,
      PitcherStats,
    ]),
    TeamsModule,
    PlayersModule,
    RecordsModule,
    GamesModule,
  ],
  controllers: [
    AppController,
    UsersController,
    TeamsController,
    RecordsController,
    GamesController,
  ],
  providers: [AppService, TeamsService, RecordsService, GamesService],
})
export class AppModule {}
