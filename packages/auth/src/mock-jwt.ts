import { decodeJwt, isJwtExpired } from '@mitdrone/utils';

import type { Role } from '@mitdrone/types';

export interface TokenClaims {
  sub: string;
  email: string;
  role: Role;
  vendorId?: string;
  type: 'access' | 'refresh';
  exp: number;
}

/** Reads (does not verify) claims. Production tokens are verified by the backend, never the client. */
export function getTokenClaims(token: string | null | undefined): TokenClaims | null {
  return token ? (decodeJwt<TokenClaims>(token) as TokenClaims | null) : null;
}

export const isTokenExpired = isJwtExpired;
