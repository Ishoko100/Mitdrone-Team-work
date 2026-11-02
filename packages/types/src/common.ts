export type ID = string;
export type ISODateString = string;
export type CurrencyCode = 'NGN' | 'USD' | 'GBP' | 'EUR';

/** All money values are integers in MINOR units (kobo for NGN, cents for USD). */
export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export interface Timestamps {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type SortOrder = 'asc' | 'desc';

export interface PageParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: SortOrder;
  q?: string;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
}

export interface Address {
  id: ID;
  label?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
}
