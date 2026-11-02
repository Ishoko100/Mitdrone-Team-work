import type { ID, Timestamps } from './common';

export type ReviewTarget = 'product' | 'vendor' | 'manufacturer' | 'service';

export interface Review extends Timestamps {
  id: ID;
  targetType: ReviewTarget;
  targetId: ID;
  authorId: ID;
  authorName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  status: 'published' | 'hidden';
}
