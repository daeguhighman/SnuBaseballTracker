import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import {
  seedGameWithLineupsAndStart,
  seedUser,
  seedUmpire,
  seedUmpireGame,
} from '../../utils/seedTestData';
import { Game } from '@/games/entities/game.entity';
import { Team } from '@/teams/entities/team.entity';
import { SubmitLineupRequestDto } from '@/games/dtos/lineup.dto';
import { AppDataSource } from '../../../data-source';
import { truncateAllTables } from '../../utils/truncate';
import { BatterGameStat } from '@/games/entities/batter-game-stat.entity';
import { GameStat } from '@/games/entities/game-stat.entity';
import { PitcherGameStat } from '@/games/entities/pitcher-game-stat.entity';
import * as cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';

describe('POST /games/{gameId}/plate-appearance', () => {
  let app: INestApplication;
  let game: Game;
  let homeTeam: Team;
  let awayTeam: Team;
  let homeLineupData: SubmitLineupRequestDto;
  let awayLineupData: SubmitLineupRequestDto;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
    await AppDataSource.initialize();
    await truncateAllTables();
    const seeded = await seedGameWithLineupsAndStart(app);
    game = seeded.game;
    homeTeam = seeded.homeTeam;
    awayTeam = seeded.awayTeam;
    homeLineupData = seeded.homeLineupData;
    awayLineupData = seeded.awayLineupData;
    accessToken = seeded.accessToken;
  });

  afterAll(async () => {
    await app.close();
    await AppDataSource.destroy();
  });

  describe('POST /games/{gameId}/plate-appearance', () => {
    it('should return the current batter', async () => {
      const response = await request(app.getHttpServer())
        .post(`/games/${game.id}/plate-appearance`)
        .set('Cookie', `accessToken=${accessToken}`)
        .send({
          result: '2B',
        });
      console.log(response.body);

      const gameStat = await AppDataSource.manager.findOne(GameStat, {
        where: { game: { id: game.id } },
        relations: ['homeBatterParticipation', 'awayBatterParticipation'],
      });
      expect(gameStat.awayHits).toBe(1);
      const batterGameStats = await AppDataSource.manager.find(BatterGameStat, {
        relations: [
          'batterGameParticipation',
          'batterGameParticipation.player',
        ], // 관련 정보도 함께 로드
      });
      console.log(batterGameStats);
    });
  });

  describe('POST /games/{gameId}/plate-appearance', () => {
    it('should return the current batter', async () => {
      const response = await request(app.getHttpServer())
        .post(`/games/${game.id}/plate-appearance`)
        .set('Cookie', `accessToken=${accessToken}`)
        .send({
          result: 'K',
        });
      console.log(response.body);
      // const gameStat = await AppDataSource.manager.findOne(GameStat, {
      //   where: { game: { id: game.id } },
      //   relations: ['homePitcherParticipation', 'awayPitcherParticipation'],
      // });

      const pitcherGameStats = await AppDataSource.manager.find(
        PitcherGameStat,
        {
          relations: [
            'pitcherGameParticipation',
            'pitcherGameParticipation.player',
          ],
        },
      );
      console.log(pitcherGameStats);
    });
  });

  describe('PATCH /games/{gameId}/results/batters/{batterGameStatsId}', () => {
    it('should patch the batter game stat', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/games/${game.id}/results/batters/1`)
        .set('Cookie', `accessToken=${accessToken}`)
        .send({
          AB: 1,
          H: 1,
          BB: 0,
          '2B': 0,
          '3B': 0,
          HR: 0,
          SAC: 0,
        });
      console.log(response.body);
    });
  });
});
