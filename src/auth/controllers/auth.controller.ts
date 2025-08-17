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
  Res,
  UseGuards,
  Delete,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@auth/services/auth.service';
import { RequestCodeDto, VerifyCodeDto } from '@auth/dtos/code.dto';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from '@/auth/dtos/password-reset.dto';
import { Request, Response } from 'express';
import { LoginDto, SignupDto } from '@/auth/dtos/signup.dto';
import { REFRESH_COOKIE } from '@/auth/constants/auth.constants';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { ChangePasswordDto } from '@/auth/dtos/change-password.dto';
import { ConfigService } from '@nestjs/config';
@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('signup')
  async signup(
    @Body() body: SignupDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.signup(body);
    // (1) refresh ⇒ HttpOnly 쿠키
    res.cookie(
      'refresh_token',
      refreshToken,
      REFRESH_COOKIE(this.configService),
    );

    // (2) access ⇒ JSON
    return { accessToken };
  }

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 14,
    });
    return { accessToken };
  }
  @Public()
  @Post('refresh')
  async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refresh(refreshToken);
    // res.cookie(
    //   'refresh_token',
    //   newRefreshToken,
    //   REFRESH_COOKIE(this.configService),
    // );
    return { accessToken };
  }

  @Post('logout')
  async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.userId);
    res.clearCookie('refresh_token');
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('password/change')
  async change(
    @Req() req,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
    );

    // 새로운 리프레시 토큰을 쿠키로 설정
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 14, // 14일
    });

    return { message: 'Password changed successfully' };
  }

  @Delete('user')
  async delete(@Req() req, @Res({ passthrough: true }) res: Response) {
    await this.authService.deleteAccount(req.user.userId);
    // Optional: clear tokens/cookies
    res.clearCookie('refresh_token');
    return { message: 'Account deleted' };
  }

  @Public()
  @Post('email/request')
  @HttpCode(200)
  requestCode(@Body() body: RequestCodeDto) {
    return this.authService.requestCode(body);
  }
  @Public()
  @Post('email/verify')
  @HttpCode(200)
  async verify(@Body() body: VerifyCodeDto) {
    return this.authService.verifyCode(body);
  }

  @Public()
  @Post('password/request-reset')
  @HttpCode(200)
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Public()
  @Post('password/reset')
  @HttpCode(200)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.resetPassword(dto);

    // 비밀번호 재설정 성공 시 refresh_token 쿠키 제거 (보안상)
    res.clearCookie('refresh_token');

    return result;
  }
}
