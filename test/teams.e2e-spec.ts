import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('Teams (e2e)', () => {
  let app: INestApplication;

  // 테스트 시작 전 애플리케이션 설정
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // 테스트 종료 후 정리
  afterAll(async () => {
    await app.close();
  });

  // /teams/grouped 엔드포인트 E2E 테스트
  describe('/teams/grouped (GET)', () => {
    it('should return grouped teams', () => {
      // HTTP GET 요청 테스트
      return request(app.getHttpServer())
        .get('/teams/grouped')
        .expect(200) // HTTP 상태 코드 검증
        .expect((res) => {
          // 응답 데이터 구조 검증
          expect(res.body).toHaveProperty('A');
          expect(Array.isArray(res.body.A)).toBe(true);
        });
    });
  });

  // /teams/:teamId/players 엔드포인트 E2E 테스트
  describe('/teams/:teamId/players (GET)', () => {
    // 정상 케이스 테스트
    it('should return team players', () => {
      return request(app.getHttpServer())
        .get('/teams/1/players')
        .expect(200)
        .expect((res) => {
          // 응답 데이터 구조 검증
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('players');
          expect(Array.isArray(res.body.players)).toBe(true);
        });
    });

    // 에러 케이스 테스트
    it('should return 404 for non-existent team', () => {
      // 존재하지 않는 팀 ID로 요청
      return request(app.getHttpServer()).get('/teams/999/players').expect(404); // Not Found 상태 코드 검증
    });
  });
});
