import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly configService: ConfigService) {
    const secret = configService.get('auth.jwtAccessSecret');

    // Bearer 토큰 추출 함수에 로그 추가
    const customExtractor = (request: Request) => {
      const authHeader = request.headers.authorization;
      this.logger.debug(`JWT Strategy - Authorization header: ${authHeader}`);

      if (!authHeader) {
        this.logger.debug('JWT Strategy - No Authorization header found');
        return null;
      }

      if (!authHeader.startsWith('Bearer ')) {
        this.logger.debug(
          'JWT Strategy - Authorization header does not start with Bearer',
        );
        return null;
      }

      const token = authHeader.substring(7); // 'Bearer ' 제거
      this.logger.debug(
        `JWT Strategy - Extracted token: ${token.substring(0, 20)}...`,
      );

      return token;
    };

    super({
      jwtFromRequest: customExtractor,
      ignoreExpiration: false,
      secretOrKey: secret,
    });

    this.logger.debug('JWT Strategy - Constructor completed');
  }

  /*
  JWT가 정상적으로 디코딩·검증되면, validate()가 호출됩니다.
  반환한 객체는 이후 request.user에 할당돼서 컨트롤러나 Guard에서 사용 가능합니다.
  */
  async validate(payload: any) {
    this.logger.debug(
      `JWT Strategy - validate called with payload: ${JSON.stringify(payload)}`,
    );
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
