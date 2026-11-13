/** Hierarchical keys: invalidating ['seller', vendorId, 'orders'] refreshes every cached variant. */
export const keys = {
  catalog: (...parts: unknown[]) => ['catalog', ...parts] as const,
  backendCatalog: (...parts: unknown[]) => ['backend', 'catalog', ...parts] as const,
  backendOrganizations: (...parts: unknown[]) =>
    ['backend', 'organizations', ...parts] as const,
  backendOrgReview: (...parts: unknown[]) =>
    ['backend', 'org-review', ...parts] as const,
  backendVendorOffers: (organizationId: string, ...parts: unknown[]) =>
    ['backend', 'vendor-offers', organizationId, ...parts] as const,
  backendInventory: (organizationId: string, ...parts: unknown[]) =>
    ['backend', 'inventory', organizationId, ...parts] as const,
  backendStaffCatalog: (...parts: unknown[]) =>
    ['backend', 'staff-catalog', ...parts] as const,
  backendReservations: (...parts: unknown[]) =>
    ['backend', 'reservations', ...parts] as const,
  backendOrders: (...parts: unknown[]) => ['backend', 'orders', ...parts] as const,
  backendHealth: (...parts: unknown[]) => ['backend', 'health', ...parts] as const,
  services: (...parts: unknown[]) => ['services', ...parts] as const,
  me: (...parts: unknown[]) => ['me', ...parts] as const,
  live: (...parts: unknown[]) => ['live', ...parts] as const,
  content: (...parts: unknown[]) => ['content', ...parts] as const,
  seller: (vendorId: string, ...parts: unknown[]) =>
    ['seller', vendorId, ...parts] as const,
  admin: (...parts: unknown[]) => ['admin', ...parts] as const,
};
