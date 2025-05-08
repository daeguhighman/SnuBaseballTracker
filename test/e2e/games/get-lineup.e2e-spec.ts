import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { AppDataSource } from '../../../data-source';
import {
  seedDepartments,
  seedGame,
  seedPlayers, // Assuming this returns { team1Players, team2Players }
  seedTeams,
  seedTournament,
  seedUmpire,
  seedUmpireGame,
  seedUser,
} from '../../utils/seedTestData';
import { truncateAllTables } from '../../utils/truncate';
import { Game } from '@/games/entities/game.entity';
import { Team } from '@/teams/entities/team.entity';
import {
  LineupResponseDto,
  SubmitLineupRequestDto,
} from '@/games/dtos/lineup.dto';
import { Player } from '@/players/entities/player.entity';
import { JwtService } from '@nestjs/jwt';
import { Department } from '@/players/entities/department.entity';
import * as cookieParser from 'cookie-parser';
describe('/games/{gameId}/lineup API (Submit & Get)', () => {
  let app: INestApplication;
  let seededGame: Game;
  let homeTeam: Team;
  let awayTeam: Team;
  let homePlayers: Player[];
  let awayPlayers: Player[];
  let homeLineupData: SubmitLineupRequestDto;
  let awayLineupData: SubmitLineupRequestDto;
  let accessToken: string;

  // Setup: Create app, seed data, and submit both lineups once
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
    await AppDataSource.initialize();
    await truncateAllTables();

    // 1. Seed base data
    const departments: Department[] = await seedDepartments();
    const teams = await seedTeams(); // [0]: 정호아카데미, [1]: 재료공
    homeTeam = teams[0];
    awayTeam = teams[1];
    const tournament = await seedTournament();
    const { team1Players, team2Players } = await seedPlayers(
      teams,
      departments,
    );
    homePlayers = team1Players; // ID: 1-10
    awayPlayers = team2Players; // ID: 11-20
    seededGame = await seedGame(tournament, homeTeam, awayTeam);

    // 심판 생성 및 배정
    const user = await seedUser();
    const umpire = await seedUmpire(user);
    await seedUmpireGame(umpire, seededGame);

    // JWT 토큰 생성
    const jwt = app.get(JwtService);
    accessToken = jwt.sign(
      {
        sub: umpire.userId,
        umpireId: umpire.id,
        role: 'UMPIRE',
      },
      { expiresIn: '1h', secret: process.env.JWT_SECRET || 'secret' },
    );

    // 2. Define Lineups
    homeLineupData = {
      batters: homePlayers.slice(0, 9).map((player, index) => ({
        battingOrder: index + 1,
        playerId: player.id,
        // Example positions - adjust if needed
        position: ['CF', 'SS', 'C', '1B', '2B', '3B', 'LF', 'RF', 'DH'][index],
      })),
      pitcher: {
        playerId: homePlayers[9].id, // Last player as pitcher
      },
    };

    awayLineupData = {
      batters: awayPlayers.slice(0, 9).map((player, index) => ({
        // Use first 9 away players
        battingOrder: index + 1,
        playerId: player.id,
        // Example positions - adjust if needed
        position: ['1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'C', 'DH'][index],
      })),
      pitcher: {
        playerId: awayPlayers[9].id, // Use 10th away player as pitcher
      },
    };

    // 3. Submit Home Lineup
    await request(app.getHttpServer())
      .post(`/games/${seededGame.id}/lineup`)
      .query({ teamType: 'home' }) // Submit for home team
      .set('Cookie', `accessToken=${accessToken}`)
      .send(homeLineupData)
      .expect(HttpStatus.CREATED);

    // 4. Submit Away Lineup
    await request(app.getHttpServer())
      .post(`/games/${seededGame.id}/lineup`)
      .query({ teamType: 'away' }) // Submit for away team
      .set('Cookie', `accessToken=${accessToken}`)
      .send(awayLineupData)
      .expect(HttpStatus.CREATED);
  });

  // Teardown
  afterAll(async () => {
    await app.close();
    await AppDataSource.destroy();
  });

  describe('POST /games/{gameId}/start', () => {
    it('should start the game', async () => {
      const response = await request(app.getHttpServer())
        .post(`/games/${seededGame.id}/start`)
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(HttpStatus.CREATED);
      console.log('🟢 응답:', JSON.stringify(response.body, null, 2));
    });
  });
  // Test Cases for GET requests
  describe('GET /games/{gameId}/lineup', () => {
    it('should return the correct lineup for the home team', async () => {
      const response = await request(app.getHttpServer())
        .get(`/games/${seededGame.id}/lineup`) // Query for home team
        .query({ teamType: 'home' }) // Query for home team
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(HttpStatus.OK);
      const lineupResponse: LineupResponseDto = response.body;
      console.log('🟢 응답:', JSON.stringify(lineupResponse, null, 2));

      // Verify Home Batters
      expect(lineupResponse.batters).toBeDefined();
      expect(lineupResponse.batters).toHaveLength(
        homeLineupData.batters.length,
      );
      const sortedResponseBatters = [...lineupResponse.batters].sort(
        (a, b) => a.battingOrder - b.battingOrder,
      );
      const sortedSubmittedBatters = [...homeLineupData.batters].sort(
        (a, b) => a.battingOrder - b.battingOrder,
      );
      sortedResponseBatters.forEach((batter, index) => {
        expect(batter.battingOrder).toBe(
          sortedSubmittedBatters[index].battingOrder,
        );
        expect(batter.playerId).toBe(sortedSubmittedBatters[index].playerId);
        expect(batter.position).toBe(sortedSubmittedBatters[index].position);
        // Optionally check playerName if included in response DTO
      });

      // Verify Home Pitcher
      expect(lineupResponse.pitcher).toBeDefined();
      expect(lineupResponse.pitcher.playerId).toBe(
        homeLineupData.pitcher.playerId,
      );
      // Optionally check playerName if included in response DTO
    });

    it('should return the correct lineup for the away team', async () => {
      const response = await request(app.getHttpServer())
        .get(`/games/${seededGame.id}/lineup`) // Query for away team
        .query({ teamType: 'away' }) // Query for away team
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(HttpStatus.OK);

      const lineupResponse: LineupResponseDto = response.body;
      console.log('🟢 응답:', JSON.stringify(lineupResponse, null, 2));
      // Verify Away Batters
      expect(lineupResponse.batters).toBeDefined();
      expect(lineupResponse.batters).toHaveLength(
        awayLineupData.batters.length,
      );
      const sortedResponseBatters = [...lineupResponse.batters].sort(
        (a, b) => a.battingOrder - b.battingOrder,
      );
      const sortedSubmittedBatters = [...awayLineupData.batters].sort(
        (a, b) => a.battingOrder - b.battingOrder,
      );
      sortedResponseBatters.forEach((batter, index) => {
        expect(batter.battingOrder).toBe(
          sortedSubmittedBatters[index].battingOrder,
        );
        expect(batter.playerId).toBe(sortedSubmittedBatters[index].playerId);
        expect(batter.position).toBe(sortedSubmittedBatters[index].position);
        // Optionally check playerName if included in response DTO
      });

      // Verify Away Pitcher
      expect(lineupResponse.pitcher).toBeDefined();
      expect(lineupResponse.pitcher.playerId).toBe(
        awayLineupData.pitcher.playerId,
      );
      // Optionally check playerName if included in response DTO
    });

    // it('should return 404 if game does not exist', async () => {
    //   const nonExistentGameId = 9999;
    //   await request(app.getHttpServer())
    //     .get(`/games/${nonExistentGameId}/lineup`)
    //     .query({ teamType: 'home' })
    //     .expect(HttpStatus.NOT_FOUND);
    // });

    // it('should return 404 if teamType is invalid or lineup does not exist for that team', async () => {
    //   // Example: Using an invalid teamType
    //   await request(app.getHttpServer())
    //     .get(`/games/${seededGame.id}/lineup`)
    //     .query({ teamType: 'invalidTeamType' }) // Invalid teamType
    //     .expect(HttpStatus.BAD_REQUEST); // Or NOT_FOUND depending on API validation

    // Example: Querying for a team that exists but didn't submit lineup for this game
    // (Need to seed an extra team and not submit lineup for it)
    // const extraTeam = await AppDataSource.getRepository(Team).save({ name: 'ExtraTeam' });
    // await request(app.getHttpServer())
    //   .get(`/games/${seededGame.id}/lineup`)
    //   .query({ teamId: extraTeam.id }) // Assuming API can take teamId
    //   .expect(HttpStatus.NOT_FOUND);
  });
});

// Optional: Add a describe block for POST error cases if needed
// describe('POST /games/{gameId}/lineup Error Handling', () => {
//   // Tests for invalid data, duplicate submissions, etc.
// });
