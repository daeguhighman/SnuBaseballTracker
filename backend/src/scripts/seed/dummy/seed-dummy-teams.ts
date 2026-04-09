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

export class DummyTeamSeeder {
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

  async seedDummyTeams(tournamentId: number) {
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

    console.log(`\n✅ 더미 팀 시드 데이터 생성 완료!`);
    console.log(`   - 새로 생성된 팀-대회 연결: ${createdCount}개`);
    console.log(`   - 이미 존재하는 팀-대회 연결: ${skippedCount}개`);
  }
}
