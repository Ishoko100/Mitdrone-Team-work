import { apiClient, type ApiClient } from '../client';

import { adminEndpoints } from './admin';
import { backendEndpoints } from './backend';
import { publicEndpoints } from './public';
import { sellerEndpoints } from './seller';

export type { ProductQuery } from './public';

export function createApi(client: ApiClient) {
  return {
    ...publicEndpoints(client),
    backend: backendEndpoints(client),
    seller: sellerEndpoints(client),
    admin: adminEndpoints(client),
  };
}

export type Api = ReturnType<typeof createApi>;

/** Default API bound to the shared client. */
export const api: Api = createApi(apiClient);
