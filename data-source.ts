import { config } from 'dotenv';
import { join, resolve } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import databaseConfig from './src/config/database.config';
import { existsSync } from 'fs';

const NODE_ENV = process.env.NODE_ENV ?? 'development';

const envFilePriority = [`.env.${NODE_ENV}`, `.env`];

// 이 코드 작동하는지 확인 필요
for (const file of envFilePriority) {
  const abs = resolve(process.cwd(), file);
  if (existsSync(abs)) {
    config({ path: abs });
    break;
  }
}

const dbConfig = databaseConfig();

export const AppDataSource = new DataSource({
  ...dbConfig,
  migrations: [join(__dirname, 'migrations', '**/*.js')],
  migrationsTableName: 'migrations',
} as DataSourceOptions);
