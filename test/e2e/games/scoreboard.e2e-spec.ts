import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import {
  seedGame,
  seedScoreBoard,
  seedTournament,
  seedTeams,
  seedUmpire,
  seedUser,
  seedUmpireGame,
} from '../../utils/seedTestData';
import { Game } from '@/games/entities/game.entity';
import { Team } from '@/teams/entities/team.entity';
import { SubmitLineupRequestDto } from '@/games/dtos/lineup.dto';
import { AppDataSource } from '../../../data-source';
import { truncateAllTables } from '../../utils/truncate';
import { JwtService } from '@nestjs/jwt';
import * as cookieParser from 'cookie-parser';
describe('스코어보드 관련 api', () => {
  let app: INestApplication;
  let game: Game;
  let homeTeam: Team;
  let awayTeam: Team;
  let homeLineupData: SubmitLineupRequestDto;
  let awayLineupData: SubmitLineupRequestDto;
  let jwtService: JwtService;
  let accessToken: string;
  let gameId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
    await AppDataSource.initialize();
    await truncateAllTables();
    const tournament = await seedTournament();
    const teams = await seedTeams();
    homeTeam = teams[0];
    awayTeam = teams[1];
    game = await seedGame(tournament, homeTeam, awayTeam);
    await seedScoreBoard(game);

    const user = await seedUser();
    const umpire = await seedUmpire(user);
    await seedUmpireGame(umpire, game);
    // JWT 서비스 가져오기
    jwtService = app.get<JwtService>(JwtService);

    // JWT 토큰 생성
    accessToken = jwtService.sign({
      sub: 1, // Assuming a default user ID
      umpireId: 1, // Assuming a default umpire ID
      role: 'UMPIRE',
    });

    gameId = game.id;
  });

  afterAll(async () => {
    await app.close();
    // AppDataSource를 사용하고 있다면 다음 라인 추가
    await AppDataSource.destroy();
  });

  describe('POST /games/{gameId}/scores', () => {
    it('should return the current scoreboard', async () => {
      const response = await request(app.getHttpServer())
        .post(`/games/${game.id}/scores`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          runs: 1,
        });
      console.log('🟢 응답:', JSON.stringify(response.body, null, 2));
    });
  });

  describe('GET /games/{gameId}/scores', () => {
    it('should return the current scoreboard', async () => {
      const response = await request(app.getHttpServer())
        .get(`/games/${game.id}/scores`)
        .set('Cookie', [`accessToken=${accessToken}`]);
      console.log('🟢 응답:', JSON.stringify(response.body, null, 2));
    });
  });

  describe('PATCH /games/{gameId}/scores/{inning}/{inningHalf}', () => {
    it('should return the current scoreboard', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/games/${game.id}/scores/1/TOP`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          runs: 10,
        });
      console.log('🟢 응답:', JSON.stringify(response.body, null, 2));
    });
  });
});
