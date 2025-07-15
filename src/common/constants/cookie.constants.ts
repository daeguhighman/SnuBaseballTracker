export const ACCESS_TTL_SEC = 600; // 10 min
export const REFRESH_TTL_SEC = 60 * 60 * 24 * 14; // 14 days

export const REFRESH_COOKIE = {
  httpOnly: true,
  secure: true, // 반드시 HTTPS
  sameSite: 'none' as const,
  path: '/auth/refresh',
  maxAge: REFRESH_TTL_SEC * 1000,
};
