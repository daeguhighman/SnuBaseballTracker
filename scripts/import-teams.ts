import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { Team } from '../src/teams/entities/team.entity';
import { TeamTournament } from '../src/teams/entities/team-tournament.entity';
import { Tournament } from '../src/tournaments/entities/tournament.entity';
import { User } from '../src/users/entities/user.entity';
import * as XLSX from 'xlsx';

interface TeamData {
  name: string;
  representativeEmail: string;
  representativeName: string;
  groupName?: string; // 선택사항
}

class TeamImporter {
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

  async importTeams(excelFilePath: string, tournamentId: number) {
    console.log('팀 정보 가져오기 시작...');
    console.log(`엑셀 파일: ${excelFilePath}`);
    console.log(`대회 ID: ${tournamentId}`);

    // 엑셀 파일 읽기
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as TeamData[];

    console.log(`총 ${data.length}개의 팀 데이터를 발견했습니다.`);

    // 대회 정보 확인
    const tournament = await this.tournamentRepo.findOne({
      where: { id: tournamentId },
    });
    if (!tournament) {
      throw new Error(`대회 ID ${tournamentId}를 찾을 수 없습니다.`);
    }

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const teamData of data) {
      try {
        await this.processTeam(teamData, tournamentId);
        processedCount++;
        console.log(`✅ ${teamData.name} 처리 완료`);
      } catch (error) {
        errorCount++;
        console.error(`❌ ${teamData.name} 처리 실패:`, error.message);
      }
    }

    console.log('\n=== 처리 결과 ===');
    console.log(`처리 완료: ${processedCount}개`);
    console.log(`건너뜀: ${skippedCount}개`);
    console.log(`오류: ${errorCount}개`);
  }

  private async processTeam(teamData: TeamData, tournamentId: number) {
    // 1. 이메일로 user가 존재하는지 확인
    const user = await this.userRepo.findOne({
      where: { email: teamData.representativeEmail },
    });

    if (!user) {
      throw new Error(
        `대표자 이메일 ${teamData.representativeEmail}에 해당하는 사용자를 찾을 수 없습니다.`,
      );
    }

    // 2. team 정보 생성 또는 조회
    let team = await this.teamRepo.findOne({
      where: { name: teamData.name },
    });

    if (!team) {
      team = this.teamRepo.create({ name: teamData.name });
      team = await this.teamRepo.save(team);
      console.log(`  - 팀 생성: ${teamData.name}`);
    } else {
      console.log(`  - 기존 팀 사용: ${teamData.name}`);
    }

    // 3. team-tournament 정보 생성 또는 조회
    let teamTournament = await this.teamTournamentRepo.findOne({
      where: {
        team: { id: team.id },
        tournament: { id: tournamentId },
      },
      relations: ['representativeUser'],
    });

    if (!teamTournament) {
      // 새로운 팀-대회 생성
      const teamTournamentData = {
        team: team,
        teamId: team.id,
        tournament: { id: tournamentId },
        tournamentId: tournamentId,
        representativeUser: user,
        representativeUserId: user.id,
        ...(teamData.groupName && { groupName: teamData.groupName }),
      };

      teamTournament = this.teamTournamentRepo.create(teamTournamentData);
      teamTournament = await this.teamTournamentRepo.save(teamTournament);
      console.log(`  - 팀-대회 등록: ${teamData.name}`);
    } else {
      // 기존 팀-대회에 대표자 연결 (연결되어 있지 않은 경우)
      if (!teamTournament.representativeUser) {
        teamTournament.representativeUser = user;
        teamTournament.representativeUserId = user.id;
        await this.teamTournamentRepo.save(teamTournament);
        console.log(`  - 팀-대회에 대표자 연결: ${teamData.name}`);
      } else {
        console.log(`  - 이미 대표자가 연결된 팀: ${teamData.name}`);
      }
    }
  }
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const importer = new TeamImporter(dataSource);

  // 사용 예시
  const excelFilePath = process.argv[2];
  const tournamentId = parseInt(process.argv[3]);

  if (!excelFilePath || !tournamentId) {
    console.log('사용법: npm run import-teams <엑셀파일경로> <대회ID>');
    console.log('예시: npm run import-teams ./teams.xlsx 1');
    console.log('\n엑셀 파일 형식:');
    console.log('- name: 팀명');
    console.log(
      '- representativeEmail: 대표자 이메일 (기존 user와 일치해야 함)',
    );
    console.log('- representativeName: 대표자 이름');
    console.log('- groupName: 그룹명 (선택사항)');
    process.exit(1);
  }

  try {
    await importer.importTeams(excelFilePath, tournamentId);
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  main();
}
