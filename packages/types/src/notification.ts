import type { ID, ISODateString } from './common';

export type NotificationType =
  'order' | 'payout' | 'dispute' | 'moderation' | 'system' | 'referral';

export interface Notification {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: ISODateString;
}
