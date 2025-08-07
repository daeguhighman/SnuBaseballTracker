import { AppDataSource } from '../../data-source';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { Team } from '../teams/entities/team.entity';
import { TeamTournament } from '../teams/entities/team-tournament.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { User } from '../users/entities/user.entity';

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
    console.log('팀 시드 데이터 생성 시작...');
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
        name: '키움 히어로즈',
        groupName: 'A조',
      },
      {
        name: '롯데 자이언츠',
        groupName: 'A조',
      },
      {
        name: '삼성 라이온즈',
        groupName: 'B조',
      },
      {
        name: 'LG 트윈스',
        groupName: 'B조',
      },
      {
        name: '두산 베어스',
        groupName: 'C조',
      },
      {
        name: '한화 이글스',
        groupName: 'C조',
      },
      {
        name: 'SSG 랜더스',
        groupName: 'D조',
      },
      {
        name: 'KT 위즈',
        groupName: 'D조',
      },
      {
        name: 'NC 다이노스',
        groupName: 'E조',
      },
      {
        name: '기아 타이거즈',
        groupName: 'E조',
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
          console.log(`  - 기존 팀 사용: ${teamData.name}`);
        }

        // 3. 팀-대회 관계 생성 또는 조회
        const existingTeamTournament = await this.teamTournamentRepo.findOne({
          where: {
            teamId: team.id,
            tournamentId: tournamentId,
          },
        });

        if (existingTeamTournament) {
          console.log(`⏭️  팀-대회 관계 "${teamData.name}" 이미 존재함`);
          skippedCount++;
          continue;
        }

        // 새 팀-대회 관계 생성
        const teamTournament = this.teamTournamentRepo.create({
          teamId: team.id,
          tournamentId: tournamentId,
          groupName: teamData.groupName,
        });

        await this.teamTournamentRepo.save(teamTournament);
        console.log(
          `✅ 팀-대회 관계 "${teamData.name}" 생성 완료 (ID: ${teamTournament.id})`,
        );
        createdCount++;
      } catch (error) {
        console.error(`❌ 팀 "${teamData.name}" 처리 실패:`, error.message);
      }
    }

    console.log('\n=== 팀 시드 데이터 생성 결과 ===');
    console.log(`생성 완료: ${createdCount}개`);
    console.log(`건너뜀: ${skippedCount}개`);
  }
}

async function main() {
  try {
    await AppDataSource.initialize();
    const seeder = new TeamSeeder(AppDataSource);
    const tournamentId = 1; // 실제 대회 ID로 변경
    await seeder.seedTeams(tournamentId);
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
