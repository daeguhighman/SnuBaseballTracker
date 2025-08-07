import { Injectable, NotFoundException } from '@nestjs/common';
import { Between, EntityManager } from 'typeorm';
import { GameInningStat } from '@/games/entities/game-inning-stat.entity';
import { InningHalf } from '@/common/enums/inning-half.enum';
import { Play } from './entities/play.entity';

@Injectable()
export class EraSimulatorService {
  async calculateInningEra(
    gameId: number,
    inning: number,
    inningHalf: InningHalf,
    em: EntityManager,
  ) {
    const inningStat = await em.findOne(GameInningStat, {
      where: { gameId, inning, inningHalf },
    });

    if (!inningStat) {
      throw new NotFoundException('Inning stat not found');
    }
    const { startSeq, endSeq } = inningStat;

    const plays = await em.find(Play, {
      where: { gameId, seq: Between(startSeq, endSeq) },
    });
  }
}
