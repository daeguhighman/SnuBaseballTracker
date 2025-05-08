import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatterStat } from '@/records/entities/batter-stat.entity';
import { PitcherStat } from '@/records/entities/pitcher-stat.entity';
import { RecordsController } from '@/records/records.controller';
import { RecordsService } from '@/records/records.service';

@Module({
  imports: [TypeOrmModule.forFeature([BatterStat, PitcherStat])],
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [TypeOrmModule],
})
export class RecordsModule {}
