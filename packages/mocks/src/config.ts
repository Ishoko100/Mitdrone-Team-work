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

export const MOCK_JWT_SECRET = 'mitdrone-mock-secret';
