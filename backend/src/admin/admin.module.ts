import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminController } from '@admin/controllers/admin.controller';
import { AdminPlayersService } from '@admin/services/admin-players.service';
import { GamesModule } from '@games/games.module';
import { Player } from '@players/entities/player.entity';
import { PlayerTournament } from '@players/entities/player-tournament.entity';
import { TeamTournament } from '@teams/entities/team-tournament.entity';
import { College } from '@/profiles/entities/college.entity';
import { Department } from '@/profiles/entities/department.entity';

@Module({
  imports: [
    GamesModule,
    TypeOrmModule.forFeature([
      Player,
      PlayerTournament,
      TeamTournament,
      College,
      Department,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminPlayersService],
})
export class AdminModule {}
