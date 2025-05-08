import { Test } from '@nestjs/testing';
import {
  INestApplication,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';

import { AppModule } from '@/app.module';
import { UmpireAuthGuard } from '@/umpires/guards/umpire-auth-guard';

// **시드 데이터 함수들**
// 이 파일들과 같은 디렉토리에 seedTestData.ts가 있어야 합니다.
import {
  seedDepartments,
  seedTeams,
  seedTournament,
  seedPlayers,
  seedTeamTournaments,
  seedPlayerTournaments,
  seedGameSchedule,
  seedUmpire,
  seedUmpireGame,
  seedBatterStats,
  seedPitcherStats,
  seedUser,
} from './seedTestData';

// 테스트 중 인증을 우회하고 req.user를 설정하는 FakeAuthGuard
const FakeAuthGuard: CanActivate = {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    req.user = { sub: 1, umpireId: 1, role: 'UMPIRE' };
    return true;
  },
};

async function seedAndLineup() {
  // 1) Nest 애플리케이션 부트스트랩 (TypeORM dropSchema & synchronize 실행)
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(UmpireAuthGuard)
    .useValue(FakeAuthGuard)
    .compile();

  const app: INestApplication = moduleRef.createNestApplication();
  app.use(cookieParser());
  await app.init();

  // 2) Nest가 초기화한 DataSource 가져오기
  const dataSource = app.get<DataSource>(DataSource);

  // 3) 스키마가 준비된 뒤 시드 삽입 (한 번만 dropSchema → insert)
  let games;
  await dataSource.transaction(async (manager) => {
    const departments = await seedDepartments(manager);
    const teams = await seedTeams(manager);
    const tournament = await seedTournament(manager);
    const user = await seedUser(manager);
    const umpires = await seedUmpire(manager, user);

    await seedTeamTournaments(manager, teams, tournament);
    const { team1Players, team2Players } = await seedPlayers(
      [teams[0], teams[1]],
      departments,
      manager,
    );
    const playerTournaments = await seedPlayerTournaments(
      [...team1Players, ...team2Players],
      tournament,
      manager,
    );

    await seedBatterStats(manager, playerTournaments);
    await seedPitcherStats(manager, playerTournaments);

    games = await seedGameSchedule(manager, teams, tournament);
    await seedUmpireGame(manager, umpires, games[0]);
  });

  // 4) 시드 완료 후 라인업 API 호출
  const server = app.getHttpServer();
  const targetGame = games[0];
  const positions = ['CF', 'SS', 'C', '1B', '2B', '3B', 'LF', 'RF', 'DH'];

  // 홈 팀 라인업
  await request(server)
    .post(`/games/${targetGame.id}/lineup`)
    .query({ teamType: 'home' })
    .send({
      batters: positions.map((pos, i) => ({
        battingOrder: i + 1,
        playerId: i + 1,
        position: pos,
      })),
      pitcher: { playerId: 10 },
    })
    .expect(201);

  // 어웨이 팀 라인업
  await request(server)
    .post(`/games/${targetGame.id}/lineup`)
    .query({ teamType: 'away' })
    .send({
      batters: positions.map((pos, i) => ({
        battingOrder: i + 1,
        playerId: 16 + i,
        position: pos,
      })),
      pitcher: { playerId: 25 },
    })
    .expect(201);

  // 5) 정리
  await app.close();
  await dataSource.destroy();
  console.log('✅ 시드 삽입과 라인업 API 호출이 완료되었습니다.');
}

seedAndLineup().catch((err) => {
  console.error('❌ 스크립트 실행 중 오류 발생:', err);
  process.exit(1);
});
