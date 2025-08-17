import { ConfigService } from '@nestjs/config';

export const REFRESH_COOKIE = (configService: ConfigService) => ({
  httpOnly: true,
  secure: true, // 반드시 HTTPS
  sameSite: 'none' as const,
  domain:
    'process.env.NODE_ENV === "production" ? ".snubaseball.site" : "localhost"',
  path: '/',
  maxAge: 14 * 24 * 60 * 60 * 1000,
});
