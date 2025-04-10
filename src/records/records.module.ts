import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatterStats } from './entities/batter-stats.entity';
import { PitcherStats } from './entities/pitcher-stats.entity';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';

@Module({
  imports: [TypeOrmModule.forFeature([BatterStats, PitcherStats])],
  controllers: [RecordsController],
  providers: [RecordsService],
})
export class RecordsModule {}
