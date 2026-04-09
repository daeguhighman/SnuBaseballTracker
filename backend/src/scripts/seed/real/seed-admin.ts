import { AppDataSource } from '../../../../data-source';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { User, AppRole } from '../../../users/entities/user.entity';
import { UserProfile } from '../../../profiles/entities/profile.entity';
import * as bcrypt from 'bcrypt';

interface AdminData {
  email: string;
  nickname: string;
  password: string;
}

export class AdminSeeder {
  private dataSource: DataSource;
  private userRepo: Repository<User>;
  private profileRepo: Repository<UserProfile>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.userRepo = dataSource.getRepository(User);
    this.profileRepo = dataSource.getRepository(UserProfile);
  }

  async seedAdmins() {
    console.log('관리자 계정 시드 데이터 생성 시작...');

    const admins: AdminData[] = [
      {
        email: 'admin@snu.ac.kr',
        nickname: '관리자',
        password: 'admin123!',
      },
      {
        email: 'superadmin@snu.ac.kr',
        nickname: '슈퍼관리자',
        password: 'superadmin123!',
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const adminData of admins) {
      try {
        // 1. 기존 사용자 확인
        const existingUser = await this.userRepo.findOne({
          where: { email: adminData.email },
        });

        if (existingUser) {
          console.log(`  - 관리자 계정 이미 존재: ${adminData.email}`);
          skippedCount++;
          continue;
        }

        // 2. 비밀번호 해싱
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(adminData.password, saltRounds);

        // 3. 관리자 계정 생성
        const admin = this.userRepo.create({
          email: adminData.email,
          nickname: adminData.nickname,
          passwordHash: passwordHash,
          role: AppRole.ADMIN,
        });

        await this.userRepo.save(admin);

        // 4. 유저 프로필 생성
        const profile = this.profileRepo.create({
          user: admin,
          nickname: adminData.nickname,
        });
        await this.profileRepo.save(profile);

        console.log(`  - 관리자 계정 생성: ${adminData.email}`);
        createdCount++;
      } catch (error) {
        console.error(
          `  - 관리자 계정 생성 중 오류 발생: ${adminData.email} - ${error}`,
          error,
        );
      }
    }

    console.log(`\n✅ 관리자 계정 시드 데이터 생성 완료!`);
    console.log(`   - 새로 생성된 관리자 계정: ${createdCount}개`);
    console.log(`   - 이미 존재하는 관리자 계정: ${skippedCount}개`);
  }
}

// 스크립트 실행 함수
async function main() {
  try {
    await AppDataSource.initialize();
    console.log('데이터베이스 연결 성공');

    const seeder = new AdminSeeder(AppDataSource);
    await seeder.seedAdmins();

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
