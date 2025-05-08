import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  codeExpireMinutes: process.env.CODE_EXPIRE_MINUTES,
  codeMaxAttempts: process.env.CODE_MAX_ATTEMPTS,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  jwtSecret: process.env.JWT_SECRET,
}));
