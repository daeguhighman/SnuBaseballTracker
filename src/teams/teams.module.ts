import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { Tournament } from '@tournaments/entities/tournament.entity';
import { TeamTournament } from './entities/team-tournament.entity';
import { PlayersModule } from '@players/players.module';
@Module({
  imports: [TypeOrmModule.forFeature([Team, TeamTournament]), PlayersModule],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TypeOrmModule],
})
export class TeamsModule {}
