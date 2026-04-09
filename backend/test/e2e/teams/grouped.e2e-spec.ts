import { AppDataSource } from '../../../data-source';
import {
  seedTeams,
  seedTeamTournaments,
  seedTournament,
} from '../../utils/seedTestData';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { truncateAllTables } from '../../utils/truncate';

describe('/teams/grouped (GET)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await AppDataSource.initialize();
    await truncateAllTables();
    const teams = await seedTeams();
    const tournament = await seedTournament();
    await seedTeamTournaments(teams, tournament);
  });

  afterAll(async () => {
    await app.close();
    await AppDataSource.destroy();
  });

  it('should return grouped teams', async () => {
    const res = await request(app.getHttpServer()).get('/teams/grouped');
    console.log('🟢 응답:', JSON.stringify(res.body, null, 2)); // ✅ 응답 확인
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('A');
  });
});
