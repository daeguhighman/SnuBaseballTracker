import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /* 
  메서드 + 클래스 메타데이터 모두 체크 
  */
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true; // 공개 엔드포인트 → 통과
    return super.canActivate(context); // -> Passport 로직
  }

  /* 
  handleRequest는 AuthGuard가 내부적으로 Passport의 인증 콜백 결과를 처리하는 후크(hook) 메서드
  user가 있으면 그대로 반환 → req.user에 할당
  */
  handleRequest(err: any, user: any, info: any, _ctx: ExecutionContext) {
    if (err || !user) {
      // info?.message === 'jwt expired' | 'invalid signature'…
      this.logger.error(
        `JWT Auth Guard - Authentication failed: ${info?.message}`,
      );
      throw err || new UnauthorizedException(info?.message);
    }

    return user; // req.user 에 주입
  }
}
