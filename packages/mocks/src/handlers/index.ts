import { adminHandlers } from './admin';
import { authHandlers } from './auth';
import { catalogHandlers } from './catalog';
import { sellerHandlers } from './seller';
import { serviceHandlers } from './services';
import { shopHandlers } from './shop';

export const handlers = [
  ...authHandlers,
  ...catalogHandlers,
  ...serviceHandlers,
  ...shopHandlers,
  ...sellerHandlers,
  ...adminHandlers,
];
