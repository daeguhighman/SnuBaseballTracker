import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from './entities/tournament.entity';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { TeamsModule } from '@teams/teams.module';
import { RecordsModule } from '@records/records.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament]), TeamsModule, RecordsModule],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TypeOrmModule],
})
export class TournamentsModule {}
