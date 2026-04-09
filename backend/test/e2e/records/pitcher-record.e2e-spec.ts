import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { AppDataSource } from '../../../data-source';
import {
  seedDepartments,
  seedPlayers,
  seedPlayerTournaments,
  seedTeams,
  seedTournament,
  seedBatterStats,
  seedPitcherStats,
} from '../../utils/seedTestData';
import { truncateAllTables } from '../../utils/truncate';
import { seedTeamTournaments } from '../../utils/seedTestData';

describe('/records/batter (GET)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await AppDataSource.initialize();
    await truncateAllTables();
    const departments = await seedDepartments();
    const teams = await seedTeams();
    const { team1Players, team2Players } = await seedPlayers(
      teams,
      departments,
    );
    const tournament = await seedTournament();
    await seedTeamTournaments(teams, tournament); // 이 줄 추가
    const playerTournaments = await seedPlayerTournaments(
      [...team1Players, ...team2Players],
      tournament,
    );
    await seedPitcherStats(playerTournaments);
  });

  afterAll(async () => {
    await app.close();
    await AppDataSource.destroy();
  });

  it('should return pitcher records', async () => {
    const res = await request(app.getHttpServer()).get('/records/pitchers');
    console.log('🟢 응답:', JSON.stringify(res.body, null, 2)); // ✅ 응답 확인
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pitchers');
  });
});
