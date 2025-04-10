import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch() // 모든 예외를 잡겠다
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 500;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const excResponse = exception.getResponse();
      if (typeof excResponse === 'string') {
        message = excResponse;
      } else if (excResponse && typeof excResponse === 'object') {
        // excResponse가 객체라면, message/error/statusCode 등 세부 정보를 추출
        const { message: msg, error } = excResponse as Record<string, any>;
        message = msg || error || message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 로그 찍거나 모니터링 서비스로 전송
    // logger.error(exception);

    const errorResponse = {
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorResponse);
  }
}
