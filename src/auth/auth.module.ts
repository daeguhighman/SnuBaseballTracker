import { Module } from '@nestjs/common';
import { AuthController } from '@auth/controllers/auth.controller';
import { AuthService } from '@auth/services/auth.service';
import { UmpiresModule } from '@umpires/umpires.module';
import { MailModule } from '@mail/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '@auth/strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { GamesModule } from '@games/games.module';
@Module({
  imports: [
    UmpiresModule,
    MailModule,
    GamesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get('auth.jwtSecret'),
        signOptions: {
          expiresIn: cfg.get('auth.jwtExpiresIn'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
