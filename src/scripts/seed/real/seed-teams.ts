import { AppDataSource } from '../../../../data-source';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { Team } from '../../../teams/entities/team.entity';
import { TeamTournament } from '../../../teams/entities/team-tournament.entity';
import { Tournament } from '../../../tournaments/entities/tournament.entity';
import { User } from '../../../users/entities/user.entity';

interface TeamData {
  name: string;
  groupName?: string;
}

export class TeamSeeder {
  private dataSource: DataSource;
  private teamRepo: Repository<Team>;
  private teamTournamentRepo: Repository<TeamTournament>;
  private tournamentRepo: Repository<Tournament>;
  private userRepo: Repository<User>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.teamRepo = dataSource.getRepository(Team);
    this.teamTournamentRepo = dataSource.getRepository(TeamTournament);
    this.tournamentRepo = dataSource.getRepository(Tournament);
    this.userRepo = dataSource.getRepository(User);
  }

  async seedTeams(tournamentId: number) {
    console.log('더미 팀 시드 데이터 생성 시작...');
    console.log(`대회 ID: ${tournamentId}`);

    // 대회 정보 확인
    const tournament = await this.tournamentRepo.findOne({
      where: { id: tournamentId },
    });
    if (!tournament) {
      throw new Error(`대회 ID ${tournamentId}를 찾을 수 없습니다.`);
    }

    const teams: TeamData[] = [
      {
        name: '사회대B',
        groupName: 'A',
      },
      {
        name: '포톤스A',
        groupName: 'A',
      },
      {
        name: '라디칼스',
        groupName: 'A',
      },
      {
        name: '법대',
        groupName: 'A',
      },
      {
        name: '워리어즈',
        groupName: 'B',
      },
      {
        name: '체육교육과',
        groupName: 'B',
      },
      {
        name: '룰루',
        groupName: 'B',
      },
      {
        name: '의대',
        groupName: 'B',
      },
      {
        name: '몽키스패너즈',
        groupName: 'C',
      },
      {
        name: '재료공',
        groupName: 'C',
      },
      {
        name: '관악사',
        groupName: 'C',
      },
      {
        name: '포톤스B',
        groupName: 'C',
      },
      {
        name: '소이쏘스',
        groupName: 'D',
      },
      {
        name: '사회대A',
        groupName: 'D',
      },
      {
        name: '농생대',
        groupName: 'D',
      },
      {
        name: '로스쿨',
        groupName: 'D',
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const teamData of teams) {
      try {
        // 2. 팀 생성 또는 조회
        let team = await this.teamRepo.findOne({
          where: { name: teamData.name },
        });

        if (!team) {
          team = this.teamRepo.create({
            name: teamData.name,
          });
          team = await this.teamRepo.save(team);
          console.log(`  - 팀 생성: ${teamData.name}`);
        } else {
          console.log(`  - 팀 이미 존재: ${teamData.name}`);
        }

        // 3. TeamTournament 생성 또는 조회
        const existingTeamTournament = await this.teamTournamentRepo.findOne({
          where: {
            team: { id: team.id },
            tournament: { id: tournamentId },
          },
        });

        if (!existingTeamTournament) {
          const teamTournament = this.teamTournamentRepo.create({
            team: team,
            tournament: tournament,
            groupName: teamData.groupName,
          });
          await this.teamTournamentRepo.save(teamTournament);
          console.log(
            `  - 팀-대회 연결 생성: ${teamData.name} (${teamData.groupName})`,
          );
          createdCount++;
        } else {
          console.log(`  - 팀-대회 연결 이미 존재: ${teamData.name}`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`  - 팀 생성 중 오류 발생: ${teamData.name}`, error);
      }
    }

    console.log(`\n✅ 실제 팀 시드 데이터 생성 완료!`);
    console.log(`   - 새로 생성된 팀-대회 연결: ${createdCount}개`);
    console.log(`   - 이미 존재하는 팀-대회 연결: ${skippedCount}개`);
  }
}

// 스크립트 실행 함수
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('사용법: npm run seed:real-teams <tournamentId>');
    console.error('예시: npm run seed:real-teams 1');
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

    const seeder = new TeamSeeder(AppDataSource);
    await seeder.seedTeams(tournamentId);

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
