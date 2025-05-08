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
import { JwtService } from '@nestjs/jwt';
import * as cookieParser from 'cookie-parser';
describe('/games/{gameId}/lineup (POST)', () => {
  let app: INestApplication;
  let game: Game;
  let homeTeam: Team;
  let awayTeam: Team;
  let jwt: JwtService;
  let accessToken: string;
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

    /* department, team, tournament, player, game 생성 */
    const departments = await seedDepartments();
    const teams = await seedTeams();
    const tournament = await seedTournament();
    await seedPlayers(teams, departments);
    game = await seedGame(tournament, teams[0], teams[1]); // 홈이 정호아카데미
    homeTeam = teams[0];
    awayTeam = teams[1];

    /* umpire 생성 */
    const user = await seedUser();
    const umpire = await seedUmpire(user);
    await seedUmpireGame(umpire, game);

    /* JWT 발급 */
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

  it('should successfully submit the lineup', async () => {
    // 요청 본문 데이터 정의 (DTO 사용 권장)
    const lineupData: SubmitLineupRequestDto = {
      batters: [
        { battingOrder: 1, playerId: 1, position: 'CF' },
        { battingOrder: 2, playerId: 2, position: 'SS' },
        { battingOrder: 3, playerId: 3, position: 'C' },
        { battingOrder: 4, playerId: 4, position: '1B' },
        { battingOrder: 5, playerId: 5, position: '2B' },
        { battingOrder: 6, playerId: 6, position: '3B' },
        { battingOrder: 7, playerId: 7, position: 'LF' },
        { battingOrder: 8, playerId: 8, position: 'RF' },
        { battingOrder: 9, playerId: 9, position: 'DH' },
      ],
      pitcher: {
        playerId: 10,
      },
    };

    // API 요청 및 응답 검증
    const response = await request(app.getHttpServer())
      .post(`/games/${game.id}/lineup`)
      .set('Cookie', `accessToken=${accessToken}`)
      .query({ teamType: 'home' })
      .send(lineupData);
    // .expect(HttpStatus.CREATED); // 201 Created 상태 코드 검증
    console.log('🟢 응답:', JSON.stringify(response.body, null, 2)); // ✅ 응답 확인

    // --- 데이터베이스 검증 ---
    const gameRoasterRepo = AppDataSource.getRepository(GameRoaster);
    const batterParticipationRepo = AppDataSource.getRepository(
      BatterGameParticipation,
    );
    const pitcherParticipationRepo = AppDataSource.getRepository(
      PitcherGameParticipation,
    );

    // 1. GameRoaster 검증
    const gameRoaster = await gameRoasterRepo.findOne({
      where: { game: { id: game.id }, team: { id: homeTeam.id } },
      relations: ['game', 'team'], // 필요한 관계 로드
    });
    expect(gameRoaster).toBeDefined();
    expect(gameRoaster.game.id).toBe(game.id);
    expect(gameRoaster.team.id).toBe(homeTeam.id);

    // 2. BatterGameParticipation 검증
    const batterParticipations = await batterParticipationRepo.find({
      where: { game: { id: game.id } },
      relations: ['player'], // player 관계 로드
      order: { battingOrder: 'ASC' }, // 타순으로 정렬
    });
    expect(batterParticipations).toHaveLength(lineupData.batters.length); // 9명 생성 확인

    // 각 타자 정보 검증
    lineupData.batters.forEach((batter, index) => {
      expect(batterParticipations[index].battingOrder).toBe(
        batter.battingOrder,
      );
      expect(batterParticipations[index].player.id).toBe(batter.playerId);
      expect(batterParticipations[index].position).toBe(batter.position);
      expect(batterParticipations[index].isActive).toBe(true);
    });

    // 3. PitcherGameParticipation 검증
    const pitcherParticipation = await pitcherParticipationRepo.findOne({
      where: { game: { id: game.id } },
      relations: ['player'], // player 관계 로드
    });
    expect(pitcherParticipation).toBeDefined();
    expect(pitcherParticipation.player.id).toBe(lineupData.pitcher.playerId);
    // ------------------------
  });
});
