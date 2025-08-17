import { ConfigService } from '@nestjs/config';

export const REFRESH_COOKIE = (configService: ConfigService) => ({
  httpOnly: true,
  secure: true, // 반드시 HTTPS
  sameSite: 'none' as const,
  domain:
    configService.get('NODE_ENV') === 'production'
      ? 'snubaseball.site' // 또는 '.snubaseball.site'
      : 'localhost',
  path: '/',
  maxAge: 14 * 24 * 60 * 60 * 1000,
});
