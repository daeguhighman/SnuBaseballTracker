import { Module } from '@nestjs/common';
import { Tournament } from './entities/tournament.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [TypeOrmModule.forFeature([Tournament])],
  exports: [TypeOrmModule],
})
export class TournamentsModule {}
