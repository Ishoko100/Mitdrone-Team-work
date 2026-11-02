import type { AuthTokens } from '@mitdrone/types';

export interface TokenStore {
  getAccess(): string | null;
  getRefresh(): string | null;
  set(tokens: AuthTokens): void;
  clear(): void;
  /** Fires when another tab logs in or out. */
  subscribe(callback: () => void): () => void;
}

/**
 * MOCK-ONLY storage. The access token lives in memory; the refresh token in localStorage so
 * sessions survive a reload. PRODUCTION: have the backend set both as httpOnly, Secure,
 * SameSite cookies so JavaScript (and XSS) can never read them.
 */
export function createTokenStore(storageKey: string): TokenStore {
  const refreshKey = `${storageKey}.refresh`;
  let access: string | null = null;

  const safe = <T>(fn: () => T, fallback: T): T => {
    try {
      return fn();
    } catch {
      return fallback;
    }
  };

  return {
    getAccess: () => access,
    getRefresh: () =>
      typeof window === 'undefined'
        ? null
        : safe(() => window.localStorage.getItem(refreshKey), null),
    set(tokens) {
      access = tokens.accessToken;
      if (typeof window !== 'undefined')
        safe(() => window.localStorage.setItem(refreshKey, tokens.refreshToken), undefined);
    },
    clear() {
      access = null;
      if (typeof window !== 'undefined')
        safe(() => window.localStorage.removeItem(refreshKey), undefined);
    },
    subscribe(callback) {
      if (typeof window === 'undefined') return () => undefined;
      const handler = (event: StorageEvent) => {
        if (event.key === refreshKey || event.key === null) callback();
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
  };
}
