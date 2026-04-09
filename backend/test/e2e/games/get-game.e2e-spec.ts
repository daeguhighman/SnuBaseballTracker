import { seedGameSchedule } from '../../utils/seedTestData';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import { truncateAllTables } from '../../utils/truncate';
import { AppDataSource } from '../../../data-source';
import * as request from 'supertest';
describe('get-game', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    await AppDataSource.initialize();
    await truncateAllTables();
    await seedGameSchedule();
  });

  afterAll(async () => {
    await app.close();
    await AppDataSource.destroy();
  });

  it('should return the game', async () => {
    const response = await request(app.getHttpServer())
      .get('/games')
      .query({ from: '2025-04-23', to: '2025-04-25' })
      .expect(HttpStatus.OK);

    console.log(JSON.stringify(response.body, null, 2));
  });
});
