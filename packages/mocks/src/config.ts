export interface MockConfig {
  /** Simulated network latency in ms, or false to disable (tests). */
  latency: false | { min: number; max: number };
  /** 0..1 chance that any request fails with a 500. */
  errorRate: number;
}

export const mockConfig: MockConfig = { latency: { min: 120, max: 450 }, errorRate: 0 };

export function setMockConfig(partial: Partial<MockConfig>): void {
  Object.assign(mockConfig, partial);
}

/**
 * Mock-only signing key. NEXTAUTH_SECRET is read when handlers run on the server, but browser
 * MSW cannot read server-only environment variables and therefore uses this public demo fallback.
 * Mock JWTs are decoded, not trusted for authorization; production auth belongs on the backend.
 */
export const MOCK_JWT_SECRET =
  (typeof process !== 'undefined' && process.env.NEXTAUTH_SECRET) || 'mitdrone-mock-secret';
