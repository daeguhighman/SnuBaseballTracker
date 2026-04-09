import { Module } from '@nestjs/common';
import { Umpire } from '@umpires/entities/umpire.entity';
import { UmpireTournament } from '@umpires/entities/umpire-tournament.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Umpire, UmpireTournament])],
  exports: [TypeOrmModule],
})
export class UmpiresModule {}
