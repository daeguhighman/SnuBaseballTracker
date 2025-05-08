import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import {
  seedGameWithLineupsAndStart,
  seedUmpire,
  seedUmpireGame,
  seedUser,
} from '../../utils/seedTestData';
import { Game } from '@/games/entities/game.entity';
import { Team } from '@/teams/entities/team.entity';
import { SubmitLineupRequestDto } from '@/games/dtos/lineup.dto';
import { AppDataSource } from '../../../data-source';
import { truncateAllTables } from '../../utils/truncate';
import * as cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';
describe('GET /games/{gameId}/current-batter', () => {
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
    // AppDataSource를 사용하고 있다면 다음 라인 추가
    await AppDataSource.destroy();
  });

  describe('GET /games/{gameId}/current-batter', () => {
    it('should return the current batter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/games/${game.id}/current-batter`)
        .query({ teamType: 'home' })
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(HttpStatus.OK);
      console.log(response.body);

      expect(response.body.playerId).toBe(homeLineupData.batters[0].playerId);
    });
  });

  describe('GET /games/{gameId}/current-pitcher', () => {
    it('should return the current pitcher', async () => {
      const response = await request(app.getHttpServer())
        .get(`/games/${game.id}/current-pitcher`)
        .query({ teamType: 'home' })
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(HttpStatus.OK);
      console.log(response.body);

      expect(response.body.playerId).toBe(homeLineupData.pitcher.playerId);
    });
  });
});
