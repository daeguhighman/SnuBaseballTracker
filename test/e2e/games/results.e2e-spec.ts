import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import {
  seedGameWithLineupsAndStart,
  seedUser,
  seedUmpire,
  seedUmpireGame,
} from '../../utils/seedTestData';
import { GameStatus } from '@/common/enums/game-status.enum';
import { AppDataSource } from '../../../data-source';
import { truncateAllTables } from '../../utils/truncate';
import { Game } from '@/games/entities/game.entity';
import { TeamTournament } from '@/teams/entities/team-tournament.entity';
import * as cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';

describe('Game Results API', () => {
  let app: INestApplication;
  let game: Game;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
    await AppDataSource.initialize();
    await truncateAllTables();

    // 테스트에 필요한 데이터 시드
    const seeded = await seedGameWithLineupsAndStart(app);
    game = seeded.game;
    accessToken = seeded.accessToken;
  });

  afterAll(async () => {
    await app.close();
    await AppDataSource.destroy();
  });

  describe('POST /games/{gameId}/results', () => {
    it('should end the game and change status to EDITING', async () => {
      // 게임 종료 API 호출
      const response = await request(app.getHttpServer())
        .post(`/games/${game.id}/results`)
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(HttpStatus.CREATED);

      // 게임 상태 확인
      const updatedGame = await AppDataSource.getRepository(Game).findOne({
        where: { id: game.id },
      });

      expect(updatedGame.status).toBe(GameStatus.EDITING);
    });
  });

  describe('POST /games/{gameId}/results/finalize', () => {
    it('should finalize the game, update team tournament stats, and change status to FINALIZED', async () => {
      // 게임 상태가 EDITING인지 확인 (사전 조건)
      let currentGame = await AppDataSource.getRepository(Game).findOne({
        where: { id: game.id },
        relations: ['tournament', 'homeTeam', 'awayTeam', 'gameStat'],
      });

      expect(currentGame.status).toBe(GameStatus.EDITING);

      // 초기 팀 토너먼트 통계 조회
      const initialHomeTeamTournament = await AppDataSource.getRepository(
        TeamTournament,
      ).findOne({
        where: {
          team: { id: currentGame.homeTeam.id },
          tournament: { id: currentGame.tournament.id },
        },
      });

      const initialAwayTeamTournament = await AppDataSource.getRepository(
        TeamTournament,
      ).findOne({
        where: {
          team: { id: currentGame.awayTeam.id },
          tournament: { id: currentGame.tournament.id },
        },
      });

      // 게임 최종화 API 호출
      const response = await request(app.getHttpServer())
        .post(`/games/${game.id}/results/finalize`)
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(HttpStatus.CREATED);

      // 게임 상태 변경 확인
      const finalizedGame = await AppDataSource.getRepository(Game).findOne({
        where: { id: game.id },
      });

      expect(finalizedGame.status).toBe(GameStatus.FINALIZED);

      // 팀 토너먼트 통계 업데이트 확인
      const updatedHomeTeamTournament = await AppDataSource.getRepository(
        TeamTournament,
      ).findOne({
        where: {
          team: { id: currentGame.homeTeam.id },
          tournament: { id: currentGame.tournament.id },
        },
      });

      const updatedAwayTeamTournament = await AppDataSource.getRepository(
        TeamTournament,
      ).findOne({
        where: {
          team: { id: currentGame.awayTeam.id },
          tournament: { id: currentGame.tournament.id },
        },
      });

      // 게임 수 증가 확인
      expect(updatedHomeTeamTournament.games).toBe(
        initialHomeTeamTournament.games + 1,
      );
      expect(updatedAwayTeamTournament.games).toBe(
        initialAwayTeamTournament.games + 1,
      );

      // 득점 업데이트 확인
      expect(updatedHomeTeamTournament.runsScored).toBe(
        initialHomeTeamTournament.runsScored + currentGame.gameStat.homeScore,
      );
      expect(updatedAwayTeamTournament.runsScored).toBe(
        initialAwayTeamTournament.runsScored + currentGame.gameStat.awayScore,
      );

      // 승/패 업데이트 확인 (점수에 따라)
      if (currentGame.gameStat.homeScore > currentGame.gameStat.awayScore) {
        expect(updatedHomeTeamTournament.wins).toBe(
          initialHomeTeamTournament.wins + 1,
        );
        expect(updatedAwayTeamTournament.losses).toBe(
          initialAwayTeamTournament.losses + 1,
        );
      } else if (
        currentGame.gameStat.homeScore < currentGame.gameStat.awayScore
      ) {
        expect(updatedHomeTeamTournament.losses).toBe(
          initialHomeTeamTournament.losses + 1,
        );
        expect(updatedAwayTeamTournament.wins).toBe(
          initialAwayTeamTournament.wins + 1,
        );
      } else {
        expect(updatedHomeTeamTournament.draws).toBe(
          initialHomeTeamTournament.draws + 1,
        );
        expect(updatedAwayTeamTournament.draws).toBe(
          initialAwayTeamTournament.draws + 1,
        );
      }
    });
  });
});
