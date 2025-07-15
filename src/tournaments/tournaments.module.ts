import { Module } from '@nestjs/common';
import { Tournament } from './entities/tournament.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordsModule } from '@records/records.module';
import { TournamentsController } from './tournaments.controller';
@Module({
  imports: [TypeOrmModule.forFeature([Tournament]), RecordsModule],
  exports: [TypeOrmModule],
  controllers: [TournamentsController],
})
export class TournamentsModule {}
