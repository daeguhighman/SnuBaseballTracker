import { Injectable } from '@nestjs/common';
import { Game, GameStatus } from './entities/game.entity';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  GameInningScore,
  InningHalf,
} from './entities/game-inning-score.entity';
import { GameDto, GameScheduleResponseDto } from './dtos/game.dto';
import { GameStat } from './entities/game-stat.entity';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GameInningScore)
    private readonly gameInningScoreRepository: Repository<GameInningScore>,
    @InjectRepository(GameStat)
    private readonly gameStatRepository: Repository<GameStat>,
  ) {}
  async getGamesByDate(dateStr: string): Promise<GameScheduleResponseDto> {
    const date = new Date(dateStr);
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const games = await this.gameRepository.find({
      where: {
        startTime: Between(startDate, endDate),
      },
      order: {
        startTime: 'ASC',
      },
      relations: ['homeTeam', 'awayTeam', 'gameInningScores', 'gameStats'],
    });

    const dayOfWeekMap = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = dayOfWeekMap[date.getDay()];

    const gamesList = games.map((game) => {
      const gameDto: GameDto = {
        time: this.formatTime(game.startTime),
        status: game.status,
        homeTeam: {
          id: game.homeTeam.id,
          name: game.homeTeam.name,
          score: game.gameStats[0].home_score,
        },
        awayTeam: {
          id: game.awayTeam.id,
          name: game.awayTeam.name,
          score: game.gameStats[0].away_score,
        },
      };
      if (game.status === GameStatus.IN_PROGRESS) {
        gameDto.currentInning = game.gameStats[0].current_inning;
        gameDto.inning_half = game.gameStats[0]
          .current_inning_half as InningHalf;
      }
      return gameDto;
    });

    return {
      date: dateStr,
      dayOfWeek: dayOfWeek,
      games: gamesList,
    };
  }
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
