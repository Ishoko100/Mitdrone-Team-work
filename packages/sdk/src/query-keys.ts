/** Hierarchical keys: invalidating ['seller', vendorId, 'orders'] refreshes every cached variant. */
export const keys = {
  catalog: (...parts: unknown[]) => ['catalog', ...parts] as const,
  services: (...parts: unknown[]) => ['services', ...parts] as const,
  me: (...parts: unknown[]) => ['me', ...parts] as const,
  live: (...parts: unknown[]) => ['live', ...parts] as const,
  content: (...parts: unknown[]) => ['content', ...parts] as const,
  seller: (vendorId: string, ...parts: unknown[]) => ['seller', vendorId, ...parts] as const,
  admin: (...parts: unknown[]) => ['admin', ...parts] as const,
};
