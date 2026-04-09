import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { AppDataSource } from '../../../data-source';
import {
  seedDepartments,
  seedGame,
  seedPlayers,
  seedTeams,
  seedTournament,
  seedUmpire,
  seedUmpireGame,
  seedUser,
} from '../../utils/seedTestData';
import { truncateAllTables } from '../../utils/truncate';
import { Game } from '@/games/entities/game.entity';
import { Team } from '@/teams/entities/team.entity';
import { SubmitLineupRequestDto } from '@/games/dtos/lineup.dto';
import { GameRoaster } from '@/games/entities/game-roaster.entity';
import { BatterGameParticipation } from '@/games/entities/batter-game-participation.entity';
import { PitcherGameParticipation } from '@/games/entities/pitcher-game-participation.entity';
import * as cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';
describe('/games/{gameId}/lineup (POST)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let accessToken: string;
  let game: Game;
  let homeTeam: Team;
  let awayTeam: Team;
  // 테스트 시작 전 애플리케이션 설정
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
    await AppDataSource.initialize();
    await truncateAllTables();
    const departments = await seedDepartments();
    const teams = await seedTeams();
    const tournament = await seedTournament();
    await seedPlayers(teams, departments);
    game = await seedGame(tournament, teams[0], teams[1]); // 홈이 정호아카데미
    homeTeam = teams[0];
    awayTeam = teams[1];

    const user = await seedUser();
    const umpire = await seedUmpire(user);
    await seedUmpireGame(umpire, game);

    jwt = app.get(JwtService);
    accessToken = jwt.sign(
      {
        sub: umpire.userId,
        umpireId: umpire.id,
        role: 'UMPIRE',
      },
      { expiresIn: '1h', secret: process.env.JWT_SECRET || 'secret' },
    );
  });
  // 테스트 종료 후 정리
  afterAll(async () => {
    await app.close();
    await AppDataSource.destroy();
  });

  describe('POST /games/{gameId}/substitution', () => {
    it('should submit the substitution', async () => {
      const response = await request(app.getHttpServer())
        .post(`/games/${game.id}/substitution`)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          playerIds: [1, 2],
        });
      console.log(response.error);
      console.log(response.body);
      // expect(response.status).toBe(HttpStatus.OK);
      // expect(response.body.success).toBe(true);
      // expect(response.body.playerIds).toEqual([101, 102]);
    });
  });
});
