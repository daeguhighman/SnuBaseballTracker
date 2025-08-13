import { AppDataSource } from '../../../../data-source';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { Player } from '../../../players/entities/player.entity';
import { PlayerTournament } from '../../../players/entities/player-tournament.entity';
import { TeamTournament } from '../../../teams/entities/team-tournament.entity';
import { Tournament } from '../../../tournaments/entities/tournament.entity';
import { User, AppRole } from '../../../users/entities/user.entity';
import { College } from '../../../profiles/entities/college.entity';
import { Department } from '../../../profiles/entities/department.entity';

interface PlayerData {
  name: string;
  email: string;
  college: string;
  department: string;
  backNumber: number;
  isElite: boolean;
  teamName: string;
}

export class DummyPlayerSeeder {
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
    // 대회 정보 확인
    const tournament = await this.tournamentRepo.findOne({
      where: { id: tournamentId },
    });
    if (!tournament) {
      throw new Error(`대회 ID ${tournamentId}를 찾을 수 없습니다.`);
    }

    const players: PlayerData[] = [
      // 롯데 자이언츠 선수들 - 선발
      {
        name: '나균안',
        email: 'na.gyunan@lotte.com',
        college: '공과대학',
        department: '기계공학부',
        backNumber: 1,
        isElite: true,
        teamName: '롯데 자이언츠',
      },
      {
        name: '황성빈',
        email: 'hwang.sungbin@lotte.com',
        college: '자연과학대학',
        department: '물리천문학부',
        backNumber: 2,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '한태양',
        email: 'han.taeyang@lotte.com',
        college: '공과대학',
        department: '건설환경공학부',
        backNumber: 3,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '레이예스',
        email: 'reyes@lotte.com',
        college: '자연과학대학',
        department: '화학부',
        backNumber: 4,
        isElite: true,
        teamName: '롯데 자이언츠',
      },
      {
        name: '전준우',
        email: 'jeon.junwoo@lotte.com',
        college: '공과대학',
        department: '전기정보공학부',
        backNumber: 5,
        isElite: true,
        teamName: '롯데 자이언츠',
      },
      {
        name: '윤동희',
        email: 'yoon.donghee@lotte.com',
        college: '인문대학',
        department: '국어국문학과',
        backNumber: 6,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '유강남',
        email: 'yu.kangnam@lotte.com',
        college: '자연과학대학',
        department: '생명과학부',
        backNumber: 7,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '김민성',
        email: 'kim.minsung@lotte.com',
        college: '공과대학',
        department: '화학생물공학부',
        backNumber: 8,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '정훈',
        email: 'jung.hun@lotte.com',
        college: '자연과학대학',
        department: '수리과학부',
        backNumber: 9,
        isElite: true,
        teamName: '롯데 자이언츠',
      },
      {
        name: '전민재',
        email: 'jeon.minjae@lotte.com',
        college: '공과대학',
        department: '건축학부',
        backNumber: 10,
        isElite: false,
        teamName: '롯데 자이언츠',
      },

      // 롯데 후보야수
      {
        name: '정보근',
        email: 'jung.bogeun@lotte.com',
        college: '자연과학대학',
        department: '조선해양공학부',
        backNumber: 11,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '나승엽',
        email: 'na.seungyeop@lotte.com',
        college: '공과대학',
        department: '항공우주공학부',
        backNumber: 12,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '이호준',
        email: 'lee.hojun@lotte.com',
        college: '자연과학대학',
        department: '지구환경과학부',
        backNumber: 13,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '박찬형',
        email: 'park.chanhyung@lotte.com',
        college: '공과대학',
        department: '원자핵공학과',
        backNumber: 14,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '김동혁',
        email: 'kim.donghyuk@lotte.com',
        college: '자연과학대학',
        department: '생물학과',
        backNumber: 15,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '장두성',
        email: 'jang.doosung@lotte.com',
        college: '공과대학',
        department: '항공우주공학과',
        backNumber: 16,
        isElite: false,
        teamName: '롯데 자이언츠',
      },

      // 롯데 불펜투수
      {
        name: '감보아',
        email: 'gam.boa@lotte.com',
        college: '자연과학대학',
        department: '지질학과',
        backNumber: 17,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '김강현',
        email: 'kim.kanghyun@lotte.com',
        college: '공과대학',
        department: '소프트웨어학부',
        backNumber: 18,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '김원중',
        email: 'kim.wonjung@lotte.com',
        college: '자연과학대학',
        department: '기계공학부',
        backNumber: 19,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '데이비슨',
        email: 'davison@lotte.com',
        college: '공과대학',
        department: '물리천문학부',
        backNumber: 20,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '박세웅',
        email: 'park.sewoong@lotte.com',
        college: '자연과학대학',
        department: '건설환경공학부',
        backNumber: 21,
        isElite: true,
        teamName: '롯데 자이언츠',
      },
      {
        name: '심재민',
        email: 'shim.jaemin@lotte.com',
        college: '공과대학',
        department: '화학부',
        backNumber: 22,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '윤성빈',
        email: 'yoon.sungbin@lotte.com',
        college: '자연과학대학',
        department: '전기정보공학부',
        backNumber: 23,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '이민석',
        email: 'lee.minseok@lotte.com',
        college: '인문대학',
        department: '국어국문학과',
        backNumber: 24,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '정철원',
        email: 'jung.chulwon@lotte.com',
        college: '자연과학대학',
        department: '생명과학부',
        backNumber: 25,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '정현수',
        email: 'jung.hyunsoo@lotte.com',
        college: '공과대학',
        department: '화학생물공학부',
        backNumber: 26,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '최준용',
        email: 'choi.joonyong@lotte.com',
        college: '자연과학대학',
        department: '수리과학부',
        backNumber: 27,
        isElite: false,
        teamName: '롯데 자이언츠',
      },
      {
        name: '홍민기',
        email: 'hong.mingi@lotte.com',
        college: '공과대학',
        department: '건축학부',
        backNumber: 28,
        isElite: false,
        teamName: '롯데 자이언츠',
      },

      // 키움 히어로즈 선수들 - 선발
      {
        name: '웰스',
        email: 'wells@kiwoom.com',
        college: '공과대학',
        department: '기계공학부',
        backNumber: 29,
        isElite: true,
        teamName: '키움 히어로즈',
      },
      {
        name: '송성문',
        email: 'song.sungmoon@kiwoom.com',
        college: '자연과학대학',
        department: '물리천문학부',
        backNumber: 30,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '임지열',
        email: 'lim.jiyeol@kiwoom.com',
        college: '공과대학',
        department: '건설환경공학부',
        backNumber: 31,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '이주형',
        email: 'lee.juhyung@kiwoom.com',
        college: '자연과학대학',
        department: '화학부',
        backNumber: 32,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '카디네스',
        email: 'cardines@kiwoom.com',
        college: '공과대학',
        department: '전기정보공학부',
        backNumber: 33,
        isElite: true,
        teamName: '키움 히어로즈',
      },
      {
        name: '최주환',
        email: 'choi.juhwan@kiwoom.com',
        college: '인문대학',
        department: '국어국문학과',
        backNumber: 34,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '주성원',
        email: 'joo.sungwon@kiwoom.com',
        college: '자연과학대학',
        department: '생명과학부',
        backNumber: 35,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '김건희',
        email: 'kim.geonhee@kiwoom.com',
        college: '공과대학',
        department: '화학생물공학부',
        backNumber: 36,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '권혁빈',
        email: 'kwon.hyukbin@kiwoom.com',
        college: '자연과학대학',
        department: '수리과학부',
        backNumber: 37,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '어준서',
        email: 'eo.junseo@kiwoom.com',
        college: '공과대학',
        department: '건축학부',
        backNumber: 38,
        isElite: false,
        teamName: '키움 히어로즈',
      },

      // 키움 후보야수
      {
        name: '김재현',
        email: 'kim.jaehyun@kiwoom.com',
        college: '자연과학대학',
        department: '조선해양공학부',
        backNumber: 39,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '이주형',
        email: 'lee.juhyung2@kiwoom.com',
        college: '공과대학',
        department: '항공우주공학부',
        backNumber: 40,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '양현종',
        email: 'yang.hyunjong@kiwoom.com',
        college: '자연과학대학',
        department: '지구환경과학부',
        backNumber: 41,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '오선진',
        email: 'oh.sunjin@kiwoom.com',
        college: '공과대학',
        department: '원자핵공학과',
        backNumber: 42,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '원성준',
        email: 'won.sungjun@kiwoom.com',
        college: '자연과학대학',
        department: '생물학과',
        backNumber: 43,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '이용규',
        email: 'lee.yongkyu@kiwoom.com',
        college: '공과대학',
        department: '항공우주공학과',
        backNumber: 44,
        isElite: false,
        teamName: '키움 히어로즈',
      },

      // 키움 불펜투수
      {
        name: '김선기',
        email: 'kim.sungi@kiwoom.com',
        college: '자연과학대학',
        department: '지질학과',
        backNumber: 45,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '김연주',
        email: 'kim.yeonju@kiwoom.com',
        college: '공과대학',
        department: '소프트웨어학부',
        backNumber: 46,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '박윤성',
        email: 'park.yoonsung@kiwoom.com',
        college: '자연과학대학',
        department: '기계공학부',
        backNumber: 47,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '박정훈',
        email: 'park.junghun@kiwoom.com',
        college: '공과대학',
        department: '물리천문학부',
        backNumber: 48,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '알칸타라',
        email: 'alcantara@kiwoom.com',
        college: '자연과학대학',
        department: '건설환경공학부',
        backNumber: 49,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '오석주',
        email: 'oh.seokju@kiwoom.com',
        college: '공과대학',
        department: '화학부',
        backNumber: 50,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '원종현',
        email: 'won.jonghyun@kiwoom.com',
        college: '자연과학대학',
        department: '전기정보공학부',
        backNumber: 51,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '윤석원',
        email: 'yoon.seokwon@kiwoom.com',
        college: '인문대학',
        department: '국어국문학과',
        backNumber: 52,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '이준우',
        email: 'lee.junwoo@kiwoom.com',
        college: '자연과학대학',
        department: '생명과학부',
        backNumber: 53,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '정현우',
        email: 'jung.hyunwoo@kiwoom.com',
        college: '공과대학',
        department: '화학생물공학부',
        backNumber: 54,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '조영건',
        email: 'jo.younggeon@kiwoom.com',
        college: '자연과학대학',
        department: '수리과학부',
        backNumber: 55,
        isElite: false,
        teamName: '키움 히어로즈',
      },
      {
        name: '주승우',
        email: 'joo.seungwoo@kiwoom.com',
        college: '공과대학',
        department: '건축학부',
        backNumber: 56,
        isElite: false,
        teamName: '키움 히어로즈',
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const playerData of players) {
      try {
        // 1. 대학 및 학과 생성 또는 조회
        let college = await this.collegeRepo.findOne({
          where: { name: playerData.college },
        });

        if (!college) {
          college = this.collegeRepo.create({
            name: playerData.college,
          });
          college = await this.collegeRepo.save(college);
        }

        let department = await this.departmentRepo.findOne({
          where: {
            name: playerData.department,
            college: { id: college.id },
          },
        });

        if (!department) {
          department = this.departmentRepo.create({
            name: playerData.department,
            college: college,
          });
          department = await this.departmentRepo.save(department);
        }

        // 2. 팀-대회 정보 조회
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

        // 3. 사용자 생성 또는 조회
        let user = await this.userRepo.findOne({
          where: { email: playerData.email },
        });

        if (!user) {
          user = this.userRepo.create({
            email: playerData.email,
            nickname: playerData.name,
            passwordHash: 'dummy_hash', // 실제로는 해시된 비밀번호 필요
            role: AppRole.NORMAL,
          });
          user = await this.userRepo.save(user);
        }

        // 4. 선수 생성 또는 조회
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
            user: user,
          });
          player = await this.playerRepo.save(player);
        }

        // 5. 선수-대회 관계 생성 또는 조회
        const existingPlayerTournament =
          await this.playerTournamentRepo.findOne({
            where: {
              playerId: player.id,
              tournamentId: tournamentId,
            },
          });

        if (existingPlayerTournament) {
          console.log(`⏭️  선수-대회 관계 "${playerData.name}" 이미 존재함`);
          skippedCount++;
          continue;
        }

        // 새 선수-대회 관계 생성
        const playerTournament = this.playerTournamentRepo.create({
          playerId: player.id,
          tournamentId: tournamentId,
          teamTournamentId: teamTournament.id,
          backNumber: playerData.backNumber,
        });

        await this.playerTournamentRepo.save(playerTournament);
        console.log(
          `✅ 선수-대회 관계 "${playerData.name}" 생성 완료 (ID: ${playerTournament.id})`,
        );
        createdCount++;
      } catch (error) {
        console.error(`❌ 선수 "${playerData.name}" 처리 실패:`, error.message);
      }
    }

    console.log('\n=== 선수 시드 데이터 생성 결과 ===');
    console.log(`생성 완료: ${createdCount}개`);
    console.log(`건너뜀: ${skippedCount}개`);
  }
}

async function main() {
  try {
    await AppDataSource.initialize();
    const seeder = new DummyPlayerSeeder(AppDataSource);
    const tournamentId = 1; // 실제 대회 ID로 변경
    await seeder.seedPlayers(tournamentId);
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
