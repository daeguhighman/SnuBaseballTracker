import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  codeExpireMinutes: process.env.CODE_EXPIRE_MINUTES,
  codeMaxAttempts: process.env.CODE_MAX_ATTEMPTS,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtEmailVerificationExpiresIn: process.env.JWT_EMAIL_VERIFICATION_EXPIRES_IN,
  jwtEmailVerificationSecret: process.env.JWT_EMAIL_VERIFICATION_SECRET,
  jwtIssuer: process.env.JWT_ISSUER,
  accessTtlSec: process.env.ACCESS_TTL_SEC,
  refreshTtlSec: process.env.REFRESH_TTL_SEC,
}));
