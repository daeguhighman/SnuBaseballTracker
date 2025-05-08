// import 'reflect-metadata'; // TypeORM 쓰면 보통 필요합니다
import { AppDataSource } from '../../data-source';
import { truncateAllTables } from './truncateAllTables';

async function main() {
  // 1) 데이터소스 초기화
  await AppDataSource.initialize();

  // 2) 모든 테이블 트렁케이트
  await truncateAllTables();
  console.log('✅ All tables truncated.');

  // 3) 연결 종료
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
