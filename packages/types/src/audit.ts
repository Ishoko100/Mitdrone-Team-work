import type { ID, ISODateString } from './common';
import type { Role } from './user';

export type AuditAction =
  | 'vendor.approve'
  | 'vendor.reject'
  | 'vendor.suspend'
  | 'product.approve'
  | 'product.flag'
  | 'product.delete'
  | 'order.refund'
  | 'dispute.resolve'
  | 'dispute.assign'
  | 'payout.process'
  | 'payout.hold'
  | 'user.update_role'
  | 'user.suspend'
  | 'settings.update'
  | 'export.create';

export type AuditEntityType =
  'vendor' | 'product' | 'order' | 'dispute' | 'payout' | 'user' | 'settings';

export interface AuditLog {
  id: ID;
  actorId: ID;
  actorName: string;
  actorRole: Role;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: ID;
  summary: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  createdAt: ISODateString;
}
