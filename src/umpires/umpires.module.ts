import { Module } from '@nestjs/common';
import { Umpire } from '@umpires/entities/umpire.entity';
import { UmpireTournament } from '@umpires/entities/umpire-tournament.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UmpireEmailCode } from '@umpires/entities/umpire-email-code.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Umpire, UmpireTournament, UmpireEmailCode]),
  ],
  exports: [TypeOrmModule],
})
export class UmpiresModule {}
