import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from '@auth/controllers/auth.controller';
import { AuthService } from '@auth/services/auth.service';
import { UmpiresModule } from '@umpires/umpires.module';
import { MailModule } from '@mail/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '@auth/strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { GamesModule } from '@games/games.module';
import { SessionsModule } from '@/sessions/session.module';
import { UsersModule } from '@/users/users.module';
import { Umpire } from '@/umpires/entities/umpire.entity';
import { Game } from '@/games/entities/game.entity';
import { EmailCode } from '@/mail/email-code.entity';
import { PasswordResetToken } from '@/mail/password-reset-token.entity';
import { Session } from '@/sessions/entities/session.entity';
import { User } from '@/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Umpire,
      Game,
      EmailCode,
      PasswordResetToken,
      Session,
      User,
    ]),
    SessionsModule,
    UsersModule,
    UmpiresModule,
    MailModule,
    GamesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get('auth.jwtAccessSecret'),
        signOptions: {
          expiresIn: cfg.get('auth.jwtAccessExpiresIn'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
