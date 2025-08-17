import { ConfigService } from '@nestjs/config';

export const REFRESH_COOKIE = (configService: ConfigService) => ({
  httpOnly: true,
  secure: true, // 반드시 HTTPS
  sameSite: 'lax' as const,
  domain:
    configService.get('NODE_ENV') === 'production'
      ? 'snubaseball.site'
      : 'localhost',
  path: '/auth/refresh',
  maxAge: 14 * 24 * 60 * 60 * 1000,
});
