import type { ID, ISODateString, Money } from './common';

export interface ReferralEntry {
  id: ID;
  referredName: string;
  joinedAt: ISODateString;
  purchases: number;
  status: 'signed_up' | 'purchased' | 'rewarded';
  reward: Money;
}

export interface ReferralSummary {
  code: string;
  link: string;
  peopleReferred: number;
  purchases: number;
  pendingRewards: Money;
  availableRewards: Money;
  totalEarned: Money;
  entries: ReferralEntry[];
}
