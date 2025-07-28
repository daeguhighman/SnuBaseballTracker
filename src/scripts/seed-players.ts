import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { Player } from '../players/entities/player.entity';
import { PlayerTournament } from '../players/entities/player-tournament.entity';
import { TeamTournament } from '../teams/entities/team-tournament.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { User } from '../users/entities/user.entity';
import { College } from '../profiles/entities/college.entity';
import { Department } from '../profiles/entities/department.entity';

interface PlayerData {
  name: string;
  email: string;
  college: string;
  department: string;
  backNumber: number;
  isElite: boolean;
  teamName: string;
}

export class PlayerSeeder {
  private dataSource: DataSource;
  private playerRepo: Repository<Player>;
  private playerTournamentRepo: Repository<PlayerTournament>;
  private teamTournamentRepo: Repository<TeamTournament>;
  private tournamentRepo: Repository<Tournament>;
  private userRepo: Repository<User>;
  private collegeRepo: Repository<College>;
  private departmentRepo: Repository<Department>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.playerRepo = dataSource.getRepository(Player);
    this.playerTournamentRepo = dataSource.getRepository(PlayerTournament);
    this.teamTournamentRepo = dataSource.getRepository(TeamTournament);
    this.tournamentRepo = dataSource.getRepository(Tournament);
    this.userRepo = dataSource.getRepository(User);
    this.collegeRepo = dataSource.getRepository(College);
    this.departmentRepo = dataSource.getRepository(Department);
  }

  async seedPlayers(tournamentId: number) {
    console.log('선수 시드 데이터 생성 시작...');
    console.log(`대회 ID: ${tournamentId}`);

    // 대회 정보 확인
    const tournament = await this.tournamentRepo.findOne({
      where: { id: tournamentId },
    });
    if (!tournament) {
      throw new Error(`대회 ID ${tournamentId}를 찾을 수 없습니다.`);
    }

    const players: PlayerData[] = [
      // 롯데 자이언츠 선수들
      {
        name: '나균안',
        email: 'pitcher1@lotte.com',
        college: '공과대학',
        department: '기계공학부',
        backNumber: 1,
        isElite: true,
        teamName: '롯데 자이언츠',
      },
      {
        name: '황성빈',
        email: 'hwang1@lotte.com',
        college: '자연과학대학',
        department: '물리천문학부',
        backNumber: 2,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '한태양',
        email: 'han1@lotte.com',
        college: '공과대학',
        department: '건설환경공학부',
        backNumber: 3,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '레이예스',
        email: 'reyes1@lotte.com',
        college: '자연과학대학',
        department: '화학부',
        backNumber: 4,
        isElite: true,
        teamName: '롯데 자이언츠',
      },
      {
        name: '전준우',
        email: 'jeon1@lotte.com',
        college: '공과대학',
        department: '전기정보공학부',
        backNumber: 5,
        isElite: true,
        teamName: '롯데 자이언츠',
      },
      {
        name: '윤동희',
        email: 'yoon1@lotte.com',
        college: '인문대학',
        department: '국어국문학과',
        backNumber: 6,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '유강남',
        email: 'yu1@lotte.com',
        college: '자연과학대학',
        department: '생명과학부',
        backNumber: 7,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '김민성',
        email: 'kim1@lotte.com',
        college: '공과대학',
        department: '화학생물공학부',
        backNumber: 8,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '정훈',
        email: 'jung1@lotte.com',
        college: '자연과학대학',
        department: '수리과학부',
        backNumber: 9,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '전민재',
        email: 'jeon2@lotte.com',
        college: '공과대학',
        department: '건축학부',
        backNumber: 10,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      // 키움 히어로즈 선수들
      {
        name: '웰스',
        email: 'wells1@kiwoom.com',
        college: '자연과학대학',
        department: '지구환경과학부',
        backNumber: 11,
        isElite: true,
        teamName: '키움 히어로즈',
      },
      {
        name: '송성문',
        email: 'song1@kiwoom.com',
        college: '공과대학',
        department: '조선해양공학과',
        backNumber: 12,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '임지열',
        email: 'lim1@kiwoom.com',
        college: '자연과학대학',
        department: '천문학과',
        backNumber: 13,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '이주형',
        email: 'lee1@kiwoom.com',
        college: '공과대학',
        department: '산업공학과',
        backNumber: 14,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '카디네스',
        email: 'cardines1@kiwoom.com',
        college: '자연과학대학',
        department: '통계학과',
        backNumber: 15,
        isElite: true,
        teamName: '키움 히어로즈',
      },
      {
        name: '최주환',
        email: 'choi1@kiwoom.com',
        college: '공과대학',
        department: '원자핵공학과',
        backNumber: 16,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '주성원',
        email: 'joo1@kiwoom.com',
        college: '자연과학대학',
        department: '생물학과',
        backNumber: 17,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '김건희',
        email: 'kim2@kiwoom.com',
        college: '공과대학',
        department: '항공우주공학과',
        backNumber: 18,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '권혁빈',
        email: 'kwon1@kiwoom.com',
        college: '자연과학대학',
        department: '지질학과',
        backNumber: 19,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '어준서',
        email: 'eo1@kiwoom.com',
        college: '공과대학',
        department: '소프트웨어학부',
        backNumber: 20,
        isElite: false,
        teamName: '키움 히어로즈',
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const playerData of players) {
      try {
        // 1. 대학 및 학과 정보 확인/생성
        let college = await this.collegeRepo.findOne({
          where: { name: playerData.college },
        });
        if (!college) {
          college = this.collegeRepo.create({ name: playerData.college });
          college = await this.collegeRepo.save(college);
        }

        let department = await this.departmentRepo.findOne({
          where: { name: playerData.department },
        });
        if (!department) {
          department = this.departmentRepo.create({
            name: playerData.department,
          });
          department = await this.departmentRepo.save(department);
        }

        // 3. 선수 정보 확인/생성
        let player = await this.playerRepo.findOne({
          where: { name: playerData.name },
        });
        if (!player) {
          player = this.playerRepo.create({
            name: playerData.name,
            email: playerData.email,
            studentId:
              '2024' +
              Math.floor(Math.random() * 10000)
                .toString()
                .padStart(4, '0'),
            birthDate: new Date('2000-01-01'),
            college: college,
            department: department,
          });
          player = await this.playerRepo.save(player);
        }

        // 4. 팀-대회 정보 조회
        const teamTournament = await this.teamTournamentRepo.findOne({
          where: {
            team: { name: playerData.teamName },
            tournamentId: tournamentId,
          },
          relations: ['team'],
        });

        if (!teamTournament) {
          console.log(
            `  - 팀-대회 정보를 찾을 수 없음: ${playerData.teamName}`,
          );
          continue;
        }

        // 5. 선수-대회 정보 확인/생성
        const existingPlayerTournament =
          await this.playerTournamentRepo.findOne({
            where: {
              playerId: player.id,
              tournamentId: tournamentId,
            },
          });

        if (!existingPlayerTournament) {
          const playerTournament = this.playerTournamentRepo.create({
            player: player,
            playerId: player.id,
            tournamentId: tournamentId,
            teamTournament: teamTournament,
            teamTournamentId: teamTournament.id,
            name: playerData.name,
            backNumber: playerData.backNumber.toString(),
            isElite: playerData.isElite,
          });
          await this.playerTournamentRepo.save(playerTournament);
          console.log(
            `✅ 선수 "${playerData.name}" (${playerData.teamName}) 생성 완료`,
          );
          createdCount++;
        } else {
          console.log(`⏭️  선수 "${playerData.name}" 이미 존재함`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ 선수 "${playerData.name}" 처리 실패:`, error.message);
      }
    }

    console.log('\n=== 선수 시드 데이터 생성 결과 ===');
    console.log(`생성 완료: ${createdCount}명`);
    console.log(`건너뜀: ${skippedCount}명`);
  }
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const seeder = new PlayerSeeder(dataSource);
    const tournamentId = 1; // 실제 대회 ID로 변경
    await seeder.seedPlayers(tournamentId);
  } catch (error) {
    console.error('시드 데이터 생성 중 오류 발생:', error);
  } finally {
    await app.close();
  }
}

main();
