import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 쿠키에서 토큰 추출
        (request: Request) => {
          return request?.cookies?.accessToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }
  /*
  JWT가 정상적으로 디코딩·검증되면, validate()가 호출됩니다.
  반환한 객체는 이후 request.user에 할당돼서 컨트롤러나 Guard에서 사용 가능합니다.
  */
  async validate(payload: any) {
    return {
      userId: payload.sub,
      umpireId: payload.umpireId,
      role: payload.role,
    };
  }
}
