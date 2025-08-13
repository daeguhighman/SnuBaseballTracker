import { AppDataSource } from '../../../../data-source';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { Game } from '../../../games/entities/game.entity';
import { TeamTournament } from '../../../teams/entities/team-tournament.entity';
import { Tournament } from '../../../tournaments/entities/tournament.entity';
import { GameStatus } from '../../../common/enums/game-status.enum';

interface GameData {
  awayTeamName: string;
  homeTeamName: string;
  scheduledAt: string;
}

export class DummyGameSeeder {
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
        awayTeamName: '두산 베어스',
        homeTeamName: '한화 이글스',
        scheduledAt: '2025-08-22 08:00:00',
      },
      {
        awayTeamName: 'NC 다이노스',
        homeTeamName: 'KT 위즈',
        scheduledAt: '2025-08-22 10:00:00',
      },
      {
        awayTeamName: 'LG 트윈스',
        homeTeamName: '기아 타이거즈',
        scheduledAt: '2025-08-22 12:00:00',
      },
      {
        awayTeamName: '롯데 자이언츠',
        homeTeamName: '키움 히어로즈',
        scheduledAt: '2025-08-22 14:00:00',
      },
      {
        awayTeamName: 'SSG 랜더스',
        homeTeamName: '삼성 라이온즈',
        scheduledAt: '2025-08-22 16:00:00',
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
  try {
    await AppDataSource.initialize();
    const seeder = new DummyGameSeeder(AppDataSource);
    const tournamentId = 1; // 실제 대회 ID로 변경
    await seeder.seedGames(tournamentId);
  } catch (error) {
    console.error('시드 데이터 생성 중 오류 발생:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// 직접 실행될 때만 main() 호출
if (require.main === module) {
  main();
}
