import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from './entities/tournament.entity';
import { TournamentsController } from './tournaments.controller';
import { TeamsModule } from '@teams/teams.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament]), TeamsModule],
  controllers: [TournamentsController],
  exports: [TypeOrmModule],
})
export class TournamentsModule {}
