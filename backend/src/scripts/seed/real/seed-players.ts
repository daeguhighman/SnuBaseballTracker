import { AppDataSource } from '../../../../data-source';
import { DataSource, EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { Player } from '../../../players/entities/player.entity';
import { PlayerTournament } from '../../../players/entities/player-tournament.entity';
import { TeamTournament } from '../../../teams/entities/team-tournament.entity';
import { Tournament } from '../../../tournaments/entities/tournament.entity';
import { Department } from '../../../profiles/entities/department.entity';
import { Team } from '../../../teams/entities/team.entity';
import * as XLSX from 'xlsx';
import { College } from '../../../profiles/entities/college.entity';

interface PlayerData {
  college: string;
  department: string;
  studentId: string;
  name: string;
  isWildcard: string;
  teamName: string;
}

// // 등번호 정리 함수
// function cleanBackNumber(backNumber: string | number): number | null {
//   if (typeof backNumber === 'number') {
//     return backNumber;
//   }

//   // 문자열에서 숫자만 추출
//   const cleaned = backNumber.toString().replace(/[^0-9]/g, '');

//   if (cleaned === '') {
//     return null; // 숫자가 없으면 null 반환
//   }

//   const num = parseInt(cleaned, 10);
//   return isNaN(num) ? null : num;
// }

export class RealPlayerSeeder {
  private dataSource: DataSource;
  private playerRepo: Repository<Player>;
  private playerTournamentRepo: Repository<PlayerTournament>;
  private teamTournamentRepo: Repository<TeamTournament>;
  private tournamentRepo: Repository<Tournament>;
  private departmentRepo: Repository<Department>;
  private teamRepo: Repository<Team>;
  private collegeRepo: Repository<College>;
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.playerRepo = dataSource.getRepository(Player);
    this.playerTournamentRepo = dataSource.getRepository(PlayerTournament);
    this.teamTournamentRepo = dataSource.getRepository(TeamTournament);
    this.tournamentRepo = dataSource.getRepository(Tournament);
    this.departmentRepo = dataSource.getRepository(Department);
    this.teamRepo = dataSource.getRepository(Team);
    this.collegeRepo = dataSource.getRepository(College);
  }

  async seedRealPlayers(tournamentId: number, excelFilePath: string) {
    console.log('실제 선수 데이터 시딩 시작...');
    console.log(`대회 ID: ${tournamentId}`);
    console.log(`엑셀 파일: ${excelFilePath}`);

    // 대회 정보 확인
    const tournament = await this.tournamentRepo.findOne({
      where: { id: tournamentId },
    });
    if (!tournament) {
      throw new Error(`대회 ID ${tournamentId}를 찾을 수 없습니다.`);
    }

    // 엑셀 파일 읽기
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const players: PlayerData[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`총 ${players.length}명의 선수 데이터를 처리합니다.`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const playerData of players) {
      try {
        // 1. 대학 생성 또는 조회
        let college = await this.collegeRepo.findOne({
          where: { name: playerData.college },
        });
        if (!college) {
          college = this.collegeRepo.create({
            name: playerData.college,
          });
          college = await this.collegeRepo.save(college);
          console.log(`  - 대학 생성: ${playerData.college}`);
        }

        // 2. 학과 생성 또는 조회
        let department = await this.departmentRepo.findOne({
          where: { name: playerData.department },
        });

        if (!department) {
          department = this.departmentRepo.create({
            name: playerData.department,
          });
          department = await this.departmentRepo.save(department);
          console.log(`  - 학과 생성: ${playerData.department}`);
        }

        // 3. 팀과 팀-대회 연결 조회
        const team = await this.teamRepo.findOne({
          where: { name: playerData.teamName },
        });
        if (!team) {
          console.error(`  - 팀을 찾을 수 없음: ${playerData.teamName}`);
          errorCount++;
          continue;
        }

        const teamTournament = await this.teamTournamentRepo.findOne({
          where: {
            team: { id: team.id },
            tournament: { id: tournamentId },
          },
        });
        if (!teamTournament) {
          console.error(
            `  - 팀-대회 연결을 찾을 수 없음: ${playerData.teamName}`,
          );
          errorCount++;
          continue;
        }

        // 4. 선수 생성 또는 조회 (이름과 이메일로 구별)
        let player = await this.playerRepo.findOne({
          where: {
            name: playerData.name,
            studentId: playerData.studentId,
            department: { id: department.id },
          },
          relations: ['department'],
        });

        if (!player) {
          player = this.playerRepo.create({
            name: playerData.name,
            college: college,
            department: department,
            studentId: playerData.studentId,
          });
          player = await this.playerRepo.save(player);
          console.log(
            `  - 선수 생성: ${playerData.name} (${playerData.studentId}) (${department.name}) (${team.name})`,
          );
        }

        // 5. PlayerTournament 생성 또는 조회 (이름과 이메일로 구별)
        const existingPlayerTournament =
          await this.playerTournamentRepo.findOne({
            where: {
              playerId: player.id,
              tournamentId: tournamentId,
            },
          });

        // 등번호 정리
        // const cleanedBackNumber = cleanBackNumber(playerData.backNumber);
        // if (cleanedBackNumber === null) {
        //   console.warn(
        //     `  - 등번호가 유효하지 않음: ${playerData.name} (${playerData.backNumber}) - 등번호 없이 등록`,
        //   );
        // }

        if (!existingPlayerTournament) {
          const playerTournament = this.playerTournamentRepo.create({
            player: player,
            teamTournament: teamTournament,
            tournamentId: tournamentId,
            isWildcard: playerData.isWildcard === 'WC',
          });
          await this.playerTournamentRepo.save(playerTournament);
          console.log(
            `  - 선수-대회 연결 생성: ${playerData.name} (${playerData.studentId}) (${playerData.teamName})`,
          );
          createdCount++;
        } else {
          console.log(
            `  - 선수-대회 연결 이미 존재: ${playerData.name} (${playerData.studentId})`,
          );
          skippedCount++;
        }
      } catch (error) {
        console.error(`  - 선수 생성 중 오류 발생: ${playerData.name}`, error);
        errorCount++;
      }
    }

    console.log(`\n✅ 실제 선수 데이터 시딩 완료!`);
    console.log(`   - 새로 생성된 선수-대회 연결: ${createdCount}개`);
    console.log(`   - 이미 존재하는 선수-대회 연결: ${skippedCount}개`);
    console.log(`   - 오류 발생: ${errorCount}개`);
  }
}

// 스크립트 실행 함수
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      '사용법: npm run seed:real-players <tournamentId> <excelFilePath>',
    );
    console.error('예시: npm run seed:real-players 1 ./players.xlsx');
    process.exit(1);
  }

  const tournamentId = parseInt(args[0]);
  const excelFilePath = args[1];

  if (isNaN(tournamentId)) {
    console.error('올바른 대회 ID를 입력해주세요.');
    process.exit(1);
  }

  try {
    await AppDataSource.initialize();
    console.log('데이터베이스 연결 성공');

    const seeder = new RealPlayerSeeder(AppDataSource);
    await seeder.seedRealPlayers(tournamentId, excelFilePath);

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
