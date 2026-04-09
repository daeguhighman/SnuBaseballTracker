import { HttpException, HttpStatus } from '@nestjs/common';

export class BaseException extends HttpException {
  constructor(message: string, errorCode: string, status: HttpStatus) {
    super(
      {
        message,
        errorCode,
      },
      status,
    );
  }
}
