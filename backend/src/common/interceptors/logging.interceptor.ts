import { randomUUID } from 'crypto';
import { tap } from 'rxjs';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest<Request>();
    const { method, url, headers } = req;
    const correlationId = req.headers['x-request-id'] ?? randomUUID();

    // Authorization 헤더 값 콘솔 출력
    if (headers['authorization']) {
      this.logger.log(
        `[${correlationId}] [Authorization] ${headers['authorization']}`,
        'HTTP',
      );
    } else {
      this.logger.log(`[${correlationId}] [Authorization] (없음)`, 'HTTP');
    }

    this.logger.log(`[${correlationId}] → ${method} ${url}`, 'HTTP');

    const started = Date.now();
    return next
      .handle()
      .pipe(
        tap(() =>
          this.logger.log(
            `[${correlationId}] ← ${method} ${url} ${Date.now() - started}ms`,
            'HTTP',
          ),
        ),
      );
  }
}
