import { Module } from '@nestjs/common';
import { Umpire } from '@umpires/entities/umpire.entity';
import { UmpireTournament } from '@umpires/entities/umpire-tournament.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailCode } from '@/mail/email-code.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Umpire, UmpireTournament, EmailCode])],
  exports: [TypeOrmModule],
})
export class UmpiresModule {}
