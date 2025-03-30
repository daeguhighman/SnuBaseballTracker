// data-source.ts
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'snubaseballtracker-database.cdwua4c225kx.ap-northeast-2.rds.amazonaws.com',
  port: 3306,
  username: 'snubaseball',
  password: 'snubaseball2025',
  database: 'SNUBaseballTracker',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/**/*.js'],
  migrationsTableName: 'migrations',
});
