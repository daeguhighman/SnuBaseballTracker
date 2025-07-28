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

describe('/tournaments/{tournamentId}/teams/grouped (GET)', () => {
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

  it('should return tournament grouped teams', async () => {
    const res = await request(app.getHttpServer()).get(
      '/tournaments/1/teams/grouped',
    );
    console.log('🟢 토너먼트 팀 응답:', JSON.stringify(res.body, null, 2)); // ✅ 응답 확인
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('A');
  });

  it('should return 404 for non-existent tournament', async () => {
    const res = await request(app.getHttpServer()).get(
      '/tournaments/999/teams/grouped',
    );
    expect(res.status).toBe(404);
  });
});

describe('/tournaments/{tournamentId}/teams/{teamTournamentId}/players (GET)', () => {
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

  it('should return tournament team players', async () => {
    const res = await request(app.getHttpServer()).get(
      '/tournaments/1/teams/1/players',
    );
    console.log('🟢 토너먼트 팀 선수 응답:', JSON.stringify(res.body, null, 2)); // ✅ 응답 확인
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('players');
    expect(Array.isArray(res.body.players)).toBe(true);
  });

  it('should return 404 for non-existent tournament', async () => {
    const res = await request(app.getHttpServer()).get(
      '/tournaments/999/teams/1/players',
    );
    expect(res.status).toBe(404);
  });

  it('should return 404 for non-existent team tournament', async () => {
    const res = await request(app.getHttpServer()).get(
      '/tournaments/1/teams/999/players',
    );
    expect(res.status).toBe(404);
  });
});
