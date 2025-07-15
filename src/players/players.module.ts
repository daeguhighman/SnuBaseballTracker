import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from './entities/player.entity';
import { PlayerTournament } from './entities/player-tournament.entity';
import { Department } from '../profile/entities/department.entity';
import { Representative } from './entities/representative.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Player,
      PlayerTournament,
      Department,
      Representative,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class PlayersModule {}
