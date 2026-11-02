import type { QueryClient, QueryKey } from '@tanstack/react-query';

type Snapshot = [QueryKey, unknown][];
export interface OptimisticContext {
  snapshot: Snapshot;
}

/**
 * Applies `apply` to every cached query under `prefix` immediately, rolls back on error,
 * and refetches when settled. Spread the result into useMutation options.
 */
export function optimistic<TVars>(
  qc: QueryClient,
  prefix: QueryKey,
  apply: (cached: unknown, vars: TVars) => unknown,
) {
  return {
    onMutate: async (vars: TVars): Promise<OptimisticContext> => {
      await qc.cancelQueries({ queryKey: prefix });
      const snapshot = qc.getQueriesData({ queryKey: prefix }) as Snapshot;
      qc.setQueriesData({ queryKey: prefix }, (old: unknown) =>
        old === undefined ? old : apply(old, vars),
      );
      return { snapshot };
    },
    onError: (_error: unknown, _vars: TVars, context: OptimisticContext | undefined) => {
      context?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: prefix }),
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Updates matching items inside a Paginated<T>, an array, or a single cached entity. */
export function patchById<T extends { id: string }>(
  cached: unknown,
  id: string,
  patch: (item: T) => T,
): unknown {
  const mapList = (list: unknown[]) =>
    list.map((item) => (isRecord(item) && item['id'] === id ? patch(item as unknown as T) : item));
  if (Array.isArray(cached)) return mapList(cached);
  if (isRecord(cached) && Array.isArray(cached['data']))
    return { ...cached, data: mapList(cached['data']) };
  if (isRecord(cached) && cached['id'] === id) return patch(cached as unknown as T);
  return cached;
}

export function removeById(cached: unknown, id: string): unknown {
  const keep = (list: unknown[]) => list.filter((item) => !(isRecord(item) && item['id'] === id));
  if (Array.isArray(cached)) return keep(cached);
  if (isRecord(cached) && Array.isArray(cached['data']))
    return { ...cached, data: keep(cached['data']) };
  return cached;
}
