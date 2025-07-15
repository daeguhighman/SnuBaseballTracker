import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /** 1️⃣  메서드 + 클래스 메타데이터 모두 체크 */
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true; // 공개 엔드포인트 → 통과
    return super.canActivate(context); // -> Passport 로직
  }

  /** 2️⃣  최신 시그니처: err, user, info, context */
  handleRequest(err: any, user: any, info: any, _ctx: ExecutionContext) {
    if (err || !user) {
      // info?.message === 'jwt expired' | 'invalid signature'…
      throw err || new UnauthorizedException(info?.message);
    }
    return user; // req.user 에 주입
  }
}
