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
    const { method, url } = req;
    const correlationId = req.headers['x-request-id'] ?? randomUUID();

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
