import { AppDataSource } from '../../../../data-source';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { Game } from '../../../games/entities/game.entity';
import { TeamTournament } from '../../../teams/entities/team-tournament.entity';
import { Tournament } from '../../../tournaments/entities/tournament.entity';
import { GameStatus } from '../../../common/enums/game-status.enum';
import {
  MatchStage,
  BracketPosition,
} from '../../../common/enums/match-stage.enum';

interface GameSchedule {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  homeTeam: string;
  awayTeam: string;
  stage: MatchStage;
  bracketPosition?: BracketPosition;
  group?: string;
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
    console.log('경기 일정 시드 데이터 생성 시작...');
    console.log(`대회 ID: ${tournamentId}`);

    // 대회 정보 확인
    const tournament = await this.tournamentRepo.findOne({
      where: { id: tournamentId },
    });
    if (!tournament) {
      throw new Error(`대회 ID ${tournamentId}를 찾을 수 없습니다.`);
    }

    // 팀-대회 연결 정보 조회
    const teamTournaments = await this.teamTournamentRepo.find({
      where: { tournament: { id: tournamentId } },
      relations: ['team'],
    });

    console.log(`총 ${teamTournaments.length}개의 팀-대회 연결을 찾았습니다.`);

    // 팀 이름으로 매핑 생성
    const teamMap = new Map<string, TeamTournament>();
    teamTournaments.forEach((tt) => {
      teamMap.set(tt.team.name, tt);
    });

    // 경기 일정 데이터 (날짜순 정렬)
    const gameSchedules: GameSchedule[] = [
      // 10월 27일 (월)
      {
        date: '2025-10-27',
        time: '17:30',
        awayTeam: '사회대B',
        homeTeam: '포톤스A',
        stage: MatchStage.LEAGUE,
        group: 'A',
      },
      {
        date: '2025-10-27',
        time: '20:00',
        awayTeam: '라디칼스',
        homeTeam: '법대',
        stage: MatchStage.LEAGUE,
        group: 'A',
      },

      // 10월 29일 (수)
      {
        date: '2025-10-29',
        time: '20:30',
        awayTeam: '워리어즈',
        homeTeam: '체육교육과',
        stage: MatchStage.LEAGUE,
        group: 'B',
      },

      // 10월 30일 (목)
      {
        date: '2025-10-30',
        time: '20:30',
        awayTeam: '룰루',
        homeTeam: '의대',
        stage: MatchStage.LEAGUE,
        group: 'B',
      },

      // 10월 31일 (금)
      {
        date: '2025-10-31',
        time: '20:30',
        awayTeam: '몽키스패너즈',
        homeTeam: '재료공',
        stage: MatchStage.LEAGUE,
        group: 'C',
      },

      // 11월 1일 (토)
      {
        date: '2025-11-01',
        time: '14:00',
        awayTeam: '관악사',
        homeTeam: '포톤스B',
        stage: MatchStage.LEAGUE,
        group: 'C',
      },

      // 11월 2일 (일)
      {
        date: '2025-11-02',
        time: '14:00',
        awayTeam: '사회대A',
        homeTeam: '소이쏘스',
        stage: MatchStage.LEAGUE,
        group: 'D',
      },
      {
        date: '2025-11-02',
        time: '16:30',
        awayTeam: '농생대',
        homeTeam: '로스쿨',
        stage: MatchStage.LEAGUE,
        group: 'D',
      },
      {
        date: '2025-11-02',
        time: '19:00',
        awayTeam: '사회대B',
        homeTeam: '라디칼스',
        stage: MatchStage.LEAGUE,
        group: 'A',
      },

      // 11월 3일 (월)
      {
        date: '2025-11-03',
        time: '17:30',
        awayTeam: '포톤스A',
        homeTeam: '법대',
        stage: MatchStage.LEAGUE,
        group: 'A',
      },
      {
        date: '2025-11-03',
        time: '20:00',
        awayTeam: '워리어즈',
        homeTeam: '룰루',
        stage: MatchStage.LEAGUE,
        group: 'B',
      },

      // 11월 5일 (수)
      {
        date: '2025-11-05',
        time: '20:30',
        awayTeam: '체육교육과',
        homeTeam: '의대',
        stage: MatchStage.LEAGUE,
        group: 'B',
      },

      // 11월 6일 (목)
      {
        date: '2025-11-06',
        time: '20:30',
        awayTeam: '몽키스패너즈',
        homeTeam: '관악사',
        stage: MatchStage.LEAGUE,
        group: 'C',
      },

      // 11월 7일 (금)
      {
        date: '2025-11-07',
        time: '20:30',
        awayTeam: '재료공',
        homeTeam: '포톤스B',
        stage: MatchStage.LEAGUE,
        group: 'C',
      },

      // 11월 8일 (토)
      {
        date: '2025-11-08',
        time: '14:00',
        awayTeam: '사회대A',
        homeTeam: '농생대',
        stage: MatchStage.LEAGUE,
        group: 'D',
      },
      {
        date: '2025-11-08',
        time: '16:30',
        awayTeam: '소이쏘스',
        homeTeam: '로스쿨',
        stage: MatchStage.LEAGUE,
        group: 'D',
      },

      // 11월 9일 (일)
      {
        date: '2025-11-09',
        time: '09:00',
        awayTeam: '사회대B',
        homeTeam: '법대',
        stage: MatchStage.LEAGUE,
        group: 'A',
      },
      {
        date: '2025-11-09',
        time: '11:30',
        awayTeam: '포톤스A',
        homeTeam: '라디칼스',
        stage: MatchStage.LEAGUE,
        group: 'A',
      },
      {
        date: '2025-11-09',
        time: '14:00',
        awayTeam: '워리어즈',
        homeTeam: '의대',
        stage: MatchStage.LEAGUE,
        group: 'B',
      },
      {
        date: '2025-11-09',
        time: '16:30',
        awayTeam: '체육교육과',
        homeTeam: '룰루',
        stage: MatchStage.LEAGUE,
        group: 'B',
      },

      // 11월 10일 (월)
      {
        date: '2025-11-10',
        time: '17:30',
        awayTeam: '몽키스패너즈',
        homeTeam: '포톤스B',
        stage: MatchStage.LEAGUE,
        group: 'C',
      },
      {
        date: '2025-11-10',
        time: '20:00',
        awayTeam: '재료공',
        homeTeam: '관악사',
        stage: MatchStage.LEAGUE,
        group: 'C',
      },

      // 11월 12일 (수)
      {
        date: '2025-11-12',
        time: '20:30',
        awayTeam: '사회대A',
        homeTeam: '로스쿨',
        stage: MatchStage.LEAGUE,
        group: 'D',
      },

      // 11월 13일 (목)
      {
        date: '2025-11-13',
        time: '20:30',
        awayTeam: '소이쏘스',
        homeTeam: '농생대',
        stage: MatchStage.LEAGUE,
        group: 'D',
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const schedule of gameSchedules) {
      try {
        // 홈팀과 어웨이팀 조회
        const homeTeam = teamMap.get(schedule.homeTeam);
        const awayTeam = teamMap.get(schedule.awayTeam);

        // 토너먼트 단계의 경기는 실제 팀이 아닌 플레이스홀더이므로 스킵
        if (!homeTeam || !awayTeam) {
          console.log(
            `  - 토너먼트 경기 스킵: ${schedule.homeTeam} vs ${schedule.awayTeam}`,
          );
          skippedCount++;
          continue;
        }

        // 경기 시간 생성 (한국 시간을 UTC로 변환)
        // 한국 시간(KST) = UTC + 9시간
        const kstDateTime = new Date(`${schedule.date}T${schedule.time}:00`);
        const utcDateTime = new Date(
          kstDateTime.getTime() - 9 * 60 * 60 * 1000,
        );

        // 기존 경기 확인
        const existingGame = await this.gameRepo.findOne({
          where: {
            tournament: { id: tournamentId },
            homeTeam: { id: homeTeam.id },
            awayTeam: { id: awayTeam.id },
            startTime: utcDateTime,
          },
        });

        if (existingGame) {
          console.log(
            `  - 경기 이미 존재: ${schedule.homeTeam} vs ${schedule.awayTeam} (${schedule.date} ${schedule.time})`,
          );
          skippedCount++;
          continue;
        }

        // 경기 생성
        const game = this.gameRepo.create({
          tournament: tournament,
          awayTeam: awayTeam,
          homeTeam: homeTeam,
          startTime: utcDateTime,
          status: GameStatus.SCHEDULED,
          stage: schedule.stage,
          bracketPosition: schedule.bracketPosition,
        });

        await this.gameRepo.save(game);
        console.log(
          `  - 경기 생성: ${schedule.homeTeam} vs ${schedule.awayTeam} (${schedule.date} ${schedule.time}) [${schedule.stage}]`,
        );
        createdCount++;
      } catch (error) {
        console.error(
          `  - 경기 생성 중 오류 발생: ${schedule.homeTeam} vs ${schedule.awayTeam}`,
          error,
        );
        errorCount++;
      }
    }

    console.log(`\n✅ 경기 일정 시드 데이터 생성 완료!`);
    console.log(`   - 새로 생성된 경기: ${createdCount}개`);
    console.log(`   - 이미 존재하는 경기: ${skippedCount}개`);
    console.log(`   - 오류 발생: ${errorCount}개`);
  }
}

// 스크립트 실행 함수
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('사용법: npm run seed:games <tournamentId>');
    console.error('예시: npm run seed:games 1');
    process.exit(1);
  }

  const tournamentId = parseInt(args[0]);

  if (isNaN(tournamentId)) {
    console.error('올바른 대회 ID를 입력해주세요.');
    process.exit(1);
  }

  try {
    await AppDataSource.initialize();
    console.log('데이터베이스 연결 성공');

    const seeder = new GameSeeder(AppDataSource);
    await seeder.seedGames(tournamentId);

    console.log('시딩 완료');
    process.exit(0);
  } catch (error) {
    console.error('시딩 중 오류 발생:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main();
}
