// scripts/resetTestDb.ts
import { truncateAllTables } from 'test/utils/truncate';
import { AppDataSource } from '../data-source';

(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  // DB drop → 테이블 재생성 → 시드 삽입
  await truncateAllTables();

  await AppDataSource.destroy();
})();
