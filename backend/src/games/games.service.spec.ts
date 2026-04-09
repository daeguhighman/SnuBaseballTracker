import { Test, TestingModule } from '@nestjs/testing';
import { GamesService } from './games.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { GameInningStat } from './entities/game-inning-stat.entity';
import { GameStat } from './entities/game-stat.entity';
import { Repository } from 'typeorm';
import { GameScheduleResponseDto } from './dtos/game.dto';

describe('GamesService', () => {
  let service: GamesService;
  let gameRepository: Repository<Game>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: getRepositoryToken(Game),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(GameInningStat),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(GameStat),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
    gameRepository = module.get<Repository<Game>>(getRepositoryToken(Game));
  });

  describe('getGamesByDate', () => {
    it('should return game schedule in the correct format', async () => {
      const mockGames = [
        {
          startTime: new Date('2023-10-10T09:00:00'),
          status: 'FINALIZED',
          homeTeam: { id: 1, name: '자연대' },
          awayTeam: { id: 2, name: '공대' },
          gameStat: { homeScore: 9, awayScore: 16 },
        },
        // 추가적인 모의 게임 데이터
      ];

      jest.spyOn(gameRepository, 'find').mockResolvedValue(mockGames as any);

      const result: GameScheduleResponseDto =
        await service.getGamesByDate('2023-10-10');
      expect(result).toEqual({
        date: '2023-10-10',
        dayOfWeek: '화',
        games: [
          {
            time: '09:00',
            status: 'FINALIZED',
            homeTeam: { id: 1, name: '자연대', score: 9 },
            awayTeam: { id: 2, name: '공대', score: 16 },
          },
          // 추가적인 예상 결과
        ],
      });
    });
  });
});
