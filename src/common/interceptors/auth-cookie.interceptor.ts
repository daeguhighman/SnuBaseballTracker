import { map, Observable, tap } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Response } from 'express';

// 쿠키 이름과 옵션을 정의합니다.
const COOKIE_NAME = 'accessToken';
const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true, // JavaScript에서 접근 불가
  secure: isProduction,
  sameSite: 'none' as const,
  maxAge: 1000 * 60 * 60 * 24 * 30, // 쿠키 유효기간 (30일)
  path: '/', // 모든 경로에서 쿠키 사용 가능
};

@Injectable()
export class AuthCookieInterceptor implements NestInterceptor {
  // 인터셉터의 주요 메서드
  intercept(ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    // HTTP 응답 객체를 가져옵니다.
    const response = ctx.switchToHttp().getResponse<Response>();

    // 핸들러(controller)를 호출하고, 결과를 처리합니다.
    return next.handle().pipe(
      // 결과가 반환된 후 실행되는 tap 연산자
      tap((result: { accessToken: string }) => {
        // 결과에 accessToken이 존재하는 경우 쿠키에 설정합니다.
        if (result?.accessToken) {
          response.cookie(COOKIE_NAME, result.accessToken, COOKIE_OPTIONS);
        }
      }),
      // 최종적으로 성공 여부를 반환합니다.
      map(() => ({ success: true, message: '인증 쿠키 설정 성공' })),
    );
  }
}
