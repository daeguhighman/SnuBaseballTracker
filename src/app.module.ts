import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerConfig } from '@/config/mailer.config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

/* 도메인 모듈들 */
import { TeamsModule } from '@teams/teams.module';
import { PlayersModule } from '@players/players.module';
import { RecordsModule } from '@records/records.module';
import { GamesModule } from '@games/games.module';
import { TournamentsModule } from '@tournaments/tournaments.module';
import { UmpiresModule } from './umpires/umpires.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { AdminModule } from '@admin/admin.module';
// import { TestModule } from './test/test.module';
import databaseConfig from './config/database.config';
import authConfig from './config/auth.config';
import { LoggerModule } from './common/logger/logger.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SentryModule } from '@sentry/nestjs/setup';
import { JwtModule } from '@nestjs/jwt';
import { ProfileModule } from './profile/profile.module';
import { PlaysModule } from './plays/plays.module';

const imports = [
  /* 1️⃣  설정 */
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: (() => {
      const env = process.env.NODE_ENV ?? 'development';
      return [`.env.${env}`, '.env'];
    })(),
    load: [authConfig, databaseConfig],
    cache: true, // <— ConfigService 캐싱
    expandVariables: true,
  }),

  /* 2️⃣  메일러 */
  MailerModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: mailerConfig,
  }),

  /* 3️⃣  데이터베이스 */
  TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (cs: ConfigService) => ({
      ...cs.get('database'),
      logging: true,
    }),
  }),
  JwtModule.registerAsync({
    imports: [ConfigModule],
    useFactory: (cfg: ConfigService) => ({
      secret: cfg.get<string>('auth.jwtAccessSecret'),
      signOptions: { expiresIn: cfg.get('auth.jwtAccessExpiresIn') },
    }),
    inject: [ConfigService],
  }),

  /* 4️⃣  도메인 */
  TeamsModule,
  PlayersModule,
  RecordsModule,
  GamesModule,
  TournamentsModule,
  UmpiresModule,
  UsersModule,
  AuthModule,
  MailModule,
  AdminModule,
  ProfileModule,
  PlaysModule,
  /* 5️⃣  로깅 */
  LoggerModule,
  SentryModule.forRoot(),
];

// if (process.env.NODE_ENV === 'test') {
//   imports.push(TestModule);
// }

@Module({
  imports,
  providers: [
    LoggingInterceptor,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  controllers: [],
})
export class AppModule {}
