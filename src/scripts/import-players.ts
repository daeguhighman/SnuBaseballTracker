import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { Player } from '../players/entities/player.entity';
import { User } from '../users/entities/user.entity';
import { College } from '../profiles/entities/college.entity';
import { Department } from '../profiles/entities/department.entity';
import { PlayerTournament } from '../players/entities/player-tournament.entity';
import { TeamTournament } from '../teams/entities/team-tournament.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import * as XLSX from 'xlsx';

interface PlayerData {
  name: string;
  email: string;
  college: string;
  department: string;
  backNumber: string;
  birthDate: string; // YYYY-MM-DD 형식
}

export class PlayerImporter {
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.playerRepo = dataSource.getRepository(Player);
    this.userRepo = dataSource.getRepository(User);
    this.collegeRepo = dataSource.getRepository(College);
    this.departmentRepo = dataSource.getRepository(Department);
    this.playerTournamentRepo = dataSource.getRepository(PlayerTournament);
    this.teamTournamentRepo = dataSource.getRepository(TeamTournament);
    this.tournamentRepo = dataSource.getRepository(Tournament);
  }
  private dataSource: DataSource;
  private playerRepo: Repository<Player>;
  private userRepo: Repository<User>;
  private collegeRepo: Repository<College>;
  private departmentRepo: Repository<Department>;
  private playerTournamentRepo: Repository<PlayerTournament>;
  private teamTournamentRepo: Repository<TeamTournament>;
  private tournamentRepo: Repository<Tournament>;

  async importPlayers(
    excelFilePath: string,
    tournamentId: number,
    teamTournamentId: number,
  ) {
    console.log('선수명단 가져오기 시작...');
    console.log(`엑셀 파일: ${excelFilePath}`);
    console.log(`대회 ID: ${tournamentId}`);
    console.log(`팀-대회 ID: ${teamTournamentId}`);

    // 엑셀 파일 읽기
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as PlayerData[];

    console.log(`총 ${data.length}명의 선수 데이터를 발견했습니다.`);

    // 대회와 팀-대회 정보 확인
    const tournament = await this.tournamentRepo.findOne({
      where: { id: tournamentId },
    });
    if (!tournament) {
      throw new Error(`대회 ID ${tournamentId}를 찾을 수 없습니다.`);
    }

    const teamTournament = await this.teamTournamentRepo.findOne({
      where: { id: teamTournamentId },
    });
    if (!teamTournament) {
      throw new Error(`팀-대회 ID ${teamTournamentId}를 찾을 수 없습니다.`);
    }

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const playerData of data) {
      try {
        console.log(playerData);
        await this.processPlayer(playerData, tournamentId, teamTournamentId);
        processedCount++;
        console.log(`✅ ${playerData.name} 처리 완료`);
      } catch (error) {
        errorCount++;
        console.error(`❌ ${playerData.name} 처리 실패:`, error.message);
      }
    }

    console.log('\n=== 처리 결과 ===');
    console.log(`처리 완료: ${processedCount}명`);
    console.log(`건너뜀: ${skippedCount}명`);
    console.log(`오류: ${errorCount}명`);
  }

  private async processPlayer(
    playerData: PlayerData,
    tournamentId: number,
    teamTournamentId: number,
  ) {
    // 1. 이메일로 user가 존재하는지 확인
    const user = await this.userRepo.findOne({
      where: { email: playerData.email },
    });

    // 2. 대학 정보 생성 또는 조회
    let college = await this.collegeRepo.findOne({
      where: { name: playerData.college },
    });
    if (!college) {
      college = this.collegeRepo.create({ name: playerData.college });
      college = await this.collegeRepo.save(college);
      console.log(`  - 대학 생성: ${playerData.college}`);
    }

    // 3. 학과 정보 생성 또는 조회
    let department = await this.departmentRepo.findOne({
      where: { name: playerData.department, college: { id: college.id } },
    });
    if (!department) {
      department = this.departmentRepo.create({
        name: playerData.department,
        college: college,
      });
      department = await this.departmentRepo.save(department);
      console.log(`  - 학과 생성: ${playerData.department}`);
    }

    // 4. player 정보 생성 또는 조회
    let player = await this.playerRepo.findOne({
      where: { studentId: playerData.backNumber },
      relations: ['user'],
    });

    if (!player) {
      // 새로운 선수 생성
      const playerDataToSave = {
        name: playerData.name,
        studentId: playerData.backNumber,
        college: college,
        department: department,
        user: user || undefined,
        email: playerData.email,
        ...(playerData.birthDate && {
          birthDate: new Date(playerData.birthDate),
        }),
      };

      player = this.playerRepo.create(playerDataToSave);
      player = await this.playerRepo.save(player);
      console.log(`  - 선수 생성: ${playerData.name}`);
    } else {
      // 기존 선수에 user 연결 (연결되어 있지 않은 경우)
      if (user && !player.user) {
        player.user = user;
        await this.playerRepo.save(player);
        console.log(`  - 선수에 사용자 연결: ${playerData.name}`);
      }
    }

    // 5. player-tournament 정보 생성 또는 조회
    const existingPlayerTournament = await this.playerTournamentRepo.findOne({
      where: {
        player: { id: player.id },
        teamTournament: { id: teamTournamentId },
      },
    });

    if (!existingPlayerTournament) {
      const playerTournament = this.playerTournamentRepo.create({
        player: player,
        playerId: player.id,
        backNumber: playerData.backNumber,
        teamTournament: { id: teamTournamentId },
        teamTournamentId: teamTournamentId,
        tournamentId: tournamentId,
      });
      await this.playerTournamentRepo.save(playerTournament);
      console.log(`  - 선수-대회 등록: ${playerData.name}`);
    } else {
      console.log(`  - 이미 등록된 선수: ${playerData.name}`);
    }
  }
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const importer = new PlayerImporter(dataSource);

  const excelFilePath = process.argv[2];
  const tournamentId = parseInt(process.argv[3]);
  const teamTournamentId = parseInt(process.argv[4]);

  if (!excelFilePath) {
    console.error('엑셀 파일이 존재하지 않습니다.');
    process.exit(1);
  }
  if (!tournamentId || !teamTournamentId) {
    console.error('팀 또는 대회가 존재하지 않습니다.');
    process.exit(1);
  }

  try {
    await importer.importPlayers(excelFilePath, tournamentId, teamTournamentId);
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
