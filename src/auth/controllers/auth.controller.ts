import {
  Controller,
  HttpCode,
  Post,
  Body,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  Get,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from '@auth/services/auth.service';
import { RequestCodeDto, VerifyCodeDto } from '@auth/dtos/code.dto';
import { AuthCookieInterceptor } from '@/common/interceptors/auth-cookie.interceptor';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { BaseException } from '@/common/exceptions/base.exception';
import { ErrorCodes } from '@/common/exceptions/error-codes.enum';
@ApiTags('Auth')
@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  // @UseInterceptors(AuthCookieInterceptor)
  @ApiOperation({ summary: '현재 로그인한 유저 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '현재 로그인한 유저 정보 조회 성공',
  })
  async me(@Req() req: Request) {
    if (process.env.NODE_ENV !== 'production') {
      return {
        role: 'UMPIRE',
        umpireId: 2,
        gameIds: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      };
    }
    const token = req.cookies?.accessToken;
    return this.authService.me(token);
  }
  @Post('email/request')
  @HttpCode(200)
  @ApiOperation({ summary: '이메일 인증 코드 요청' })
  @ApiResponse({
    status: 200,
    description: '이메일 인증 코드 요청 성공',
    example: { success: true, message: '이메일 인증 코드 요청 성공' },
  })
  requestCode(@Body() body: RequestCodeDto) {
    return this.authService.requestCode(body);
  }

  @Post('email/verify')
  @HttpCode(200)
  @UseInterceptors(AuthCookieInterceptor)
  @ApiOperation({ summary: '이메일 인증 코드 검증' })
  @ApiResponse({
    status: 200,
    description: '이메일 인증 코드 검증 성공',
    example: { success: true, message: '인증 쿠키 설정 성공' },
  })
  async verify(@Body() body: VerifyCodeDto) {
    return this.authService.verifyCode(body);
  }
}
