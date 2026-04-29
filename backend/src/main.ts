import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ConfigService } from '@nestjs/config';
import {
  ClassSerializerInterceptor,
  ConsoleLogger,
  ValidationPipe,
} from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppLogger } from './common/logger/logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import './instrument';
import * as Sentry from '@sentry/nestjs';
import * as SentryNode from '@sentry/node';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const whitelist = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://10.89.191.32:3001',
    'https://snubaseball.site',
    'https://www.snubaseball.site',
  ];
  const corsOptions = {
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    origin: (origin, callback) => {
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  };
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // 정적 파일 서빙 설정
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.useLogger(app.get(AppLogger));
  app.enableCors({
    ...corsOptions,
  });
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalInterceptors(app.get(LoggingInterceptor));
  app.useGlobalFilters(new GlobalExceptionFilter(app.get(AppLogger)));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // ✅ string 같은 것도 타입 자동 변환 (ex: "123" → 123)
      whitelist: true, // ✅ DTO에 정의된 것만 허용 (나머지는 자동 삭제)
      forbidNonWhitelisted: true, // ✅ DTO에 없는 필드가 오면 요청 자체를 거부 (400 에러)
      forbidUnknownValues: true, // ✅ 완전히 이상한 값(객체 아님 등) 들어오면 막기
      transformOptions: {
        enableImplicitConversion: true, // ✅ 타입만 보고 변환할 수 있도록 허용 (class-transformer
      },
    }),
  );
  app.use(cookieParser()); //클라이언트가 보낸 쿠키를 파싱해서 req.cookies 객체로 사용할 수 있도록 해주는 미들웨어
  const configService = app.get(ConfigService);
  const env = configService.get('env');
  await app.listen(3000);
}
bootstrap();
