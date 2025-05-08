import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from './entities/player.entity';
import { PlayerTournament } from './entities/player-tournament.entity';
import { Department } from './entities/department.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Player, PlayerTournament, Department])],
  exports: [TypeOrmModule],
})
export class PlayersModule {}
