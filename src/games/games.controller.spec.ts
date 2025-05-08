import { Test, TestingModule } from '@nestjs/testing';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { NotFoundException } from '@nestjs/common';
import { GameScheduleResponseDto, GameStatus } from './dtos/game.dto';

describe('GamesController', () => {
  let gamesController: GamesController;
  let gamesService: GamesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamesController],
      providers: [
        {
          provide: GamesService,
          useValue: {
            getGamesByDate: jest.fn(),
          },
        },
      ],
    }).compile();

    gamesController = module.get<GamesController>(GamesController);
    gamesService = module.get<GamesService>(GamesService);
  });

  describe('getGamesByDate', () => {
    it('should return game schedule for a given date', async () => {
      const result: GameScheduleResponseDto = {
        date: '2023-10-10',
        dayOfWeek: '화',
        games: [
          {
            time: '09:00',
            status: GameStatus.FINALIZED,
            homeTeam: { id: 1, name: '자연대', score: 9 },
            awayTeam: { id: 2, name: '공대', score: 16 },
          },
        ],
      };
      jest.spyOn(gamesService, 'getGamesByDate').mockResolvedValue(result);

      expect(await gamesController.getGamesByDate({ date: '2023-10-10' })).toBe(
        result,
      );
    });

    it('should throw NotFoundException if no games found', async () => {
      jest.spyOn(gamesService, 'getGamesByDate').mockResolvedValue(null);

      await expect(
        gamesController.getGamesByDate({ date: '2023-10-10' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
