import type { ID, ISODateString } from './common';

export type LiveSessionType =
  | 'product_demo'
  | 'flight_demo'
  | 'product_launch'
  | 'manufacturer_session'
  | 'training'
  | 'expert_talk'
  | 'live_deal';

export type LiveSessionStatus = 'scheduled' | 'live' | 'ended';

export interface LiveSession {
  id: ID;
  title: string;
  description: string;
  type: LiveSessionType;
  status: LiveSessionStatus;
  hostName: string;
  hostVendorId: ID;
  featuredProductId?: ID;
  startsAt: ISODateString;
  viewerCount: number;
  thumbnailUrl?: string;
}

export interface LiveChatMessage {
  id: ID;
  sessionId: ID;
  authorName: string;
  body: string;
  isQuestion: boolean;
  createdAt: ISODateString;
}
