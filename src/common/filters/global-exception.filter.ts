import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCodes } from '../exceptions/error-codes.enum';
import { AppLogger } from '../logger/logger.service';
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 500;
    let message = 'Internal server error';
    let errorCode = ErrorCodes.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const excResponse = exception.getResponse();

      if (typeof excResponse === 'string') {
        message = excResponse;
      } else if (typeof excResponse === 'object' && excResponse !== null) {
        const {
          message: msg,
          error,
          errorCode: code,
        } = excResponse as Record<string, any>;
        message = Array.isArray(msg) ? msg.join(', ') : msg || error || message;
        if (code) errorCode = code;
        else if (exception instanceof BadRequestException) {
          errorCode = ErrorCodes.INVALID_INPUT;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }
    // ✅ 에러 로깅
    this.logger.error(exception, (exception as any)?.stack, 'ExceptionFilter');

    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      errorCode,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorResponse);
  }
}
