// src/common/logger/logger.service.ts
import { ConsoleLogger, Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class AppLogger extends ConsoleLogger implements LoggerService {
  private isProd = process.env.NODE_ENV === 'production';

  constructor() {
    super(); // context: 생략하거나 'AppLogger' 등 지정 가능
    this.setLogLevels(['log', 'error', 'warn', 'debug', 'verbose']);
  }

  log(message: any, context?: string) {
    super.log(this.formatJson('log', message, context), context);
  }

  error(message: any, trace?: string, context?: string) {
    super.error(
      this.formatJson('error', message, context, trace),
      trace,
      context,
    );
  }

  warn(message: any, context?: string) {
    super.warn(this.formatJson('warn', message, context), context);
  }

  debug(message: any, context?: string) {
    super.debug(this.formatJson('debug', message, context), context);
  }

  verbose(message: any, context?: string) {
    super.verbose(this.formatJson('verbose', message, context), context);
  }

  private formatJson(
    level: string,
    message: any,
    context?: string,
    trace?: string,
  ): string {
    if (!this.isProd) return message; // 개발 환경에서는 원본 출력

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      trace,
    });
  }
}
