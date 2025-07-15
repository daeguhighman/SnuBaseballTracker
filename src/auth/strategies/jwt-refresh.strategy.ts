import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@/users/users.service';

// 1) 쿠키에서 'refreshToken' 필드를 꺼내는 함수
const cookieExtractor = (req: Request): string | null => {
  return req?.cookies?.refreshToken ?? null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // 2) 헤더 또는 쿠키에서 토큰을 꺼내도록 조합
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(), // 혹시 헤더에도 담긴다면
        cookieExtractor, // 주로는 쿠키에서
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true, // 나중에 req.cookies나 세션까지 보고 싶을 때
    });
  }
}
