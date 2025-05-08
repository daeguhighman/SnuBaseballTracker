import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { AppDataSource } from '../../../data-source';
import {
  seedDepartments,
  seedPlayers,
  seedTeams,
} from '../../utils/seedTestData';
import { truncateAllTables } from '../../utils/truncate';
describe('/teams/:teamId/players (GET)', () => {
  let app: INestApplication;
  // 테스트 시작 전 애플리케이션 설정
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
    await seedPlayers(teams, departments);
  });

  // 테스트 종료 후 정리
  afterAll(async () => {
    await app.close();
    await AppDataSource.destroy();
  });

  // 정상 케이스 테스트
  it('GET /teams/1/players - should return team players', async () => {
    const res = await request(app.getHttpServer()).get('/teams/1/players');
    console.log('🟢 응답:', JSON.stringify(res.body, null, 2)); // ✅ 응답 확인

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('players');
    expect(Array.isArray(res.body.players)).toBe(true);
  });

  // 에러 케이스 테스트
  it('should return 404 for non-existent team', () => {
    // 존재하지 않는 팀 ID로 요청
    return request(app.getHttpServer()).get('/teams/999/players').expect(404); // Not Found 상태 코드 검증
  });
});
