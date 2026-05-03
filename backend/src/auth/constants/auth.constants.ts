import { ConfigService } from '@nestjs/config';

export const REFRESH_COOKIE = (configService: ConfigService) => {
  const isProduction = configService.get('NODE_ENV') === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    domain: isProduction ? '.snubaseball.com' : undefined,
    path: '/auth/refresh',
    maxAge: 14 * 24 * 60 * 60 * 1000,
  };
};
