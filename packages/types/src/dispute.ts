import type { ID, ISODateString, Money, Timestamps } from './common';

export type DisputeStatus =
  'open' | 'under_review' | 'resolved_refund' | 'resolved_no_refund' | 'closed';
export type DisputeReason = 'not_received' | 'not_as_described' | 'damaged' | 'warranty' | 'other';

export interface DisputeMessage {
  id: ID;
  authorId: ID;
  authorRole: string;
  body: string;
  createdAt: ISODateString;
}

export interface Dispute extends Timestamps {
  id: ID;
  orderId: ID;
  customerId: ID;
  vendorId: ID;
  reason: DisputeReason;
  status: DisputeStatus;
  amount: Money;
  description: string;
  messages: DisputeMessage[];
  assignedTo?: ID;
  resolution?: string;
}
