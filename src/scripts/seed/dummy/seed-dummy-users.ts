import { AppDataSource } from '../../../../data-source';
import { DataSource } from 'typeorm';
import { User, AppRole } from '../../../users/entities/user.entity';
import { UserProfile } from '../../../profiles/entities/profile.entity';
import { College } from '../../../profiles/entities/college.entity';
import { Department } from '../../../profiles/entities/department.entity';
import * as bcrypt from 'bcrypt';

export class DummyUserSeeder {
  constructor(private dataSource: DataSource) {}

  async seedUsers() {
    const userRepository = this.dataSource.getRepository(User);
    const profileRepository = this.dataSource.getRepository(UserProfile);
    const collegeRepository = this.dataSource.getRepository(College);
    const departmentRepository = this.dataSource.getRepository(Department);

    // 1. College 생성
    const college = await collegeRepository.save(
      collegeRepository.create({
        name: '서울대학교',
      }),
    );

    // 2. Department 생성
    const department = await departmentRepository.save(
      departmentRepository.create({
        name: '컴퓨터공학부',
        college: college,
      }),
    );

    // 3. Users 생성
    const users = [
      {
        email: 'admin@snu.ac.kr',
        nickname: '관리자',
        password: 'admin123',
        role: AppRole.ADMIN,
      },
      {
        email: 'umpire1@snu.ac.kr',
        nickname: '심판1',
        password: 'umpire123',
        role: AppRole.NORMAL,
      },
      {
        email: 'umpire2@snu.ac.kr',
        nickname: '심판2',
        password: 'umpire123',
        role: AppRole.NORMAL,
      },
      {
        email: 'user1@snu.ac.kr',
        nickname: '일반사용자1',
        password: 'user123',
        role: AppRole.NORMAL,
      },
      {
        email: 'user2@snu.ac.kr',
        nickname: '일반사용자2',
        password: 'user123',
        role: AppRole.NORMAL,
      },
    ];

    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await userRepository.save(
        userRepository.create({
          email: userData.email,
          nickname: userData.nickname,
          passwordHash: hashedPassword,
          role: userData.role,
        }),
      );

      // 각 사용자에 대한 프로필 생성
      await profileRepository.save(
        profileRepository.create({
          user: user,
          nickname: userData.nickname,
        }),
      );
    }

    console.log(`  ✅ ${users.length}명의 사용자 생성 완료`);
    console.log('  📋 생성된 사용자 목록:');
    console.log('    - admin@snu.ac.kr (ADMIN)');
    console.log('    - umpire1@snu.ac.kr (NORMAL)');
    console.log('    - umpire2@snu.ac.kr (NORMAL)');
    console.log('    - user1@snu.ac.kr (NORMAL)');
    console.log('    - user2@snu.ac.kr (NORMAL)');
  }
}

async function main() {
  try {
    await AppDataSource.initialize();
    const seeder = new DummyUserSeeder(AppDataSource);
    await seeder.seedUsers();
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
