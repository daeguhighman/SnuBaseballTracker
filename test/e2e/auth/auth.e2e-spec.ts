import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { AppDataSource } from '../../../data-source';
import { truncateAllTables } from '../../utils/truncate';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UmpireEmailCode } from '../../../src/umpires/entities/umpire-email-code.entity';
import { seedUser, seedUmpire } from '../../utils/seedTestData';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '@nestjs-modules/mailer';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let codeRepository: Repository<UmpireEmailCode>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        JwtModule.register({ secret: 'test' }),
        MailerModule.forRoot({
          transport: {
            host: 'localhost',
            port: 1025,
            ignoreTLS: true,
          },
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await AppDataSource.initialize();

    codeRepository = moduleFixture.get(getRepositoryToken(UmpireEmailCode));
  });

  beforeEach(async () => {
    await truncateAllTables();
    const user = await seedUser();
    await seedUmpire(user);
  });

  afterAll(async () => {
    await app.close();
    await AppDataSource.destroy();
  });

  describe('POST /auth/email/request', () => {
    it('should return 200 when requesting code for existing umpire', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/email/request')
        .send({ email: 'keroro1967@snu.ac.kr' });

      console.log('🟢 응답 결과:', response.body);
    });

    //   it('should return 404 when requesting code for non-existing umpire', () => {
    //     return request(app.getHttpServer())
    //       .post('/auth/request-code')
    //       .send({ email: 'nonexistent@snu.ac.kr' })
    //       .expect(404);
    //   });
    // });

    describe('POST /auth/email/verify', () => {
      beforeEach(async () => {
        // 테스트용 인증 코드 생성
        const testCode = '123456';
        const hash = require('crypto')
          .createHash('sha256')
          .update(testCode)
          .digest('hex');

        await codeRepository.save({
          email: 'keroro1967@snu.ac.kr',
          codeHash: hash,
          expiresAt: new Date(Date.now() + 600000), // 10분 후 만료
          tryCount: 0,
        });
      });

      it('should set a cookie when code is valid', () => {
        return request(app.getHttpServer())
          .post('/auth/email/verify')
          .send({
            email: 'keroro1967@snu.ac.kr',
            code: '123456',
          })
          .expect(201)
          .expect('Set-Cookie', new RegExp('accessToken=.*'))
          .then((res) => {
            console.log('🟢 쿠키:', res.headers['set-cookie']);
            console.log('🟢 응답 결과:', res.body);
          });
      });
    });
    //   it('should return 401 when code is invalid', () => {
    //     return request(app.getHttpServer())
    //       .post('/auth/verify-code')
    //       .send({
    //         email: 'keroro1967@snu.ac.kr',
    //         code: '000000',
    //       })
    //       .expect(401);
    //   });

    //   it('should return 401 when code is expired', async () => {
    //     // 만료된 코드로 업데이트
    //     await codeRepository.update(
    //       { email: 'keroro1967@snu.ac.kr' },
    //       { expiresAt: new Date(Date.now() - 1000) }, // 1초 전 만료
    //     );

    //     return request(app.getHttpServer())
    //       .post('/auth/verify-code')
    //       .send({
    //         email: 'keroro1967@snu.ac.kr',
    //         code: '123456',
    //       })
    //       .expect(401);
    //   });

    //   it('should return 401 after 5 failed attempts', async () => {
    //     // 5번의 실패 시도 시뮬레이션
    //     await codeRepository.update(
    //       { email: 'keroro1967@snu.ac.kr' },
    //       { tryCount: 5 },
    //     );

    //     return request(app.getHttpServer())
    //       .post('/auth/verify-code')
    //       .send({
    //         email: 'keroro1967@snu.ac.kr',
    //         code: '123456',
    //       })
    //       .expect(401);
    // });
  });
});
