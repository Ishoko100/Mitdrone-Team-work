import { encodeMockJwt } from '@mitdrone/utils';

import { MOCK_JWT_SECRET } from './config';

import type { AuthTokens, User } from '@mitdrone/types';

export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

function sign(user: User, type: 'access' | 'refresh', ttl: number): string {
  const iat = Math.floor(Date.now() / 1000);
  return encodeMockJwt(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      vendorId: user.vendorId,
      type,
      iat,
      exp: iat + ttl,
    },
    MOCK_JWT_SECRET,
  );
}

export function issueTokens(user: User): AuthTokens {
  return {
    accessToken: sign(user, 'access', ACCESS_TTL_SECONDS),
    refreshToken: sign(user, 'refresh', REFRESH_TTL_SECONDS),
    expiresIn: ACCESS_TTL_SECONDS,
  };
}
