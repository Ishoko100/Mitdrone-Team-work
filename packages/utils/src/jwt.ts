/**
 * MOCK ONLY. These tokens are not secure: the signature is a cheap checksum.
 * Production must use real signed JWTs issued by the backend, delivered in httpOnly cookies.
 */
function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): string {
  const padded = input
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(input.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function checksum(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) + hash + value.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(16);
}

export function encodeMockJwt(payload: Record<string, unknown>, secret: string): string {
  const header = toBase64Url(JSON.stringify({ alg: 'MOCK', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify(payload));
  return `${header}.${body}.${toBase64Url(checksum(`${header}.${body}.${secret}`))}`;
}

export type JwtPayload<T extends object = Record<string, unknown>> = T & {
  exp?: number;
  iat?: number;
};

/** Decodes without verifying. Returns null for malformed tokens. */
export function decodeJwt<T extends object = Record<string, unknown>>(
  token: string,
): JwtPayload<T> | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    return JSON.parse(fromBase64Url(part)) as JwtPayload<T>;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, skewSeconds = 0, nowMs: number = Date.now()): boolean {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 - skewSeconds * 1000 <= nowMs;
}
