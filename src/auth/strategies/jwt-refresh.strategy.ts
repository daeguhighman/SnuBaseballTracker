import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

// 1) 쿠키에서 'refreshToken' 필드를 꺼내는 함수
const cookieExtractor = (req: Request): string | null => {
  return req?.cookies?.refreshToken ?? null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      // 2) 헤더 또는 쿠키에서 토큰을 꺼내도록 조합
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor, // 주로는 쿠키에서
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }
}
