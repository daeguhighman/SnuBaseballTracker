import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { Game } from '../games/entities/game.entity';
import { TeamTournament } from '../teams/entities/team-tournament.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { GameStatus } from '../common/enums/game-status.enum';

interface GameData {
  homeTeamName: string;
  awayTeamName: string;
  scheduledAt: string;
  venue: string;
  description?: string;
}

export class GameSeeder {
  private dataSource: DataSource;
  private gameRepo: Repository<Game>;
  private teamTournamentRepo: Repository<TeamTournament>;
  private tournamentRepo: Repository<Tournament>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.gameRepo = dataSource.getRepository(Game);
    this.teamTournamentRepo = dataSource.getRepository(TeamTournament);
    this.tournamentRepo = dataSource.getRepository(Tournament);
  }

  async seedGames(tournamentId: number) {
    console.log('게임 시드 데이터 생성 시작...');
    console.log(`대회 ID: ${tournamentId}`);

    // 대회 정보 확인
    const tournament = await this.tournamentRepo.findOne({
      where: { id: tournamentId },
    });
    if (!tournament) {
      throw new Error(`대회 ID ${tournamentId}를 찾을 수 없습니다.`);
    }

    const games: GameData[] = [
      {
        homeTeamName: '롯데 자이언츠',
        awayTeamName: '키움 히어로즈',
        scheduledAt: '2024-03-15 14:00:00',
        venue: '사직야구장',
        description: '롯데 vs 키움 정규시즌',
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const gameData of games) {
      try {
        // 홈팀과 원정팀의 팀-대회 정보 조회
        const homeTeamTournament = await this.teamTournamentRepo.findOne({
          where: {
            team: { name: gameData.homeTeamName },
            tournamentId: tournamentId,
          },
          relations: ['team'],
        });

        const awayTeamTournament = await this.teamTournamentRepo.findOne({
          where: {
            team: { name: gameData.awayTeamName },
            tournamentId: tournamentId,
          },
          relations: ['team'],
        });

        if (!homeTeamTournament || !awayTeamTournament) {
          console.log(
            `  - 팀-대회 정보를 찾을 수 없음: ${gameData.homeTeamName} vs ${gameData.awayTeamName}`,
          );
          continue;
        }

        // 기존 게임이 있는지 확인
        const existingGame = await this.gameRepo.findOne({
          where: {
            homeTeam: { id: homeTeamTournament.id },
            awayTeam: { id: awayTeamTournament.id },
            tournamentId: tournamentId,
          },
        });

        if (existingGame) {
          console.log(
            `⏭️  게임 "${gameData.homeTeamName} vs ${gameData.awayTeamName}" 이미 존재함`,
          );
          skippedCount++;
          continue;
        }

        // 새 게임 생성
        const game = this.gameRepo.create({
          tournamentId: tournamentId,
          homeTeam: { id: homeTeamTournament.id },
          awayTeam: { id: awayTeamTournament.id },
          startTime: new Date(gameData.scheduledAt),
          status: GameStatus.SCHEDULED,
        });

        await this.gameRepo.save(game);
        console.log(
          `✅ 게임 "${gameData.homeTeamName} vs ${gameData.awayTeamName}" 생성 완료 (ID: ${game.id})`,
        );
        createdCount++;
      } catch (error) {
        console.error(
          `❌ 게임 "${gameData.homeTeamName} vs ${gameData.awayTeamName}" 처리 실패:`,
          error.message,
        );
      }
    }

    console.log('\n=== 게임 시드 데이터 생성 결과 ===');
    console.log(`생성 완료: ${createdCount}개`);
    console.log(`건너뜀: ${skippedCount}개`);
  }
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const seeder = new GameSeeder(dataSource);
    const tournamentId = 1; // 실제 대회 ID로 변경
    await seeder.seedGames(tournamentId);
  } catch (error) {
    console.error('시드 데이터 생성 중 오류 발생:', error);
  } finally {
    await app.close();
  }
}

main();
