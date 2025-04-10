import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { Tournament } from './entities/tournament.entity';
import { TeamTournament } from './entities/team-tournament.entity';
import { Player } from '@players/entities/player.entity';
import { Department } from '@players/entities/department.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Team,
      Tournament,
      TeamTournament,
      Player,
      Department,
    ]),
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
