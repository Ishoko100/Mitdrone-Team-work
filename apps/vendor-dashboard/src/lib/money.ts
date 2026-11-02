import { formatCompactMoney } from '@mitdrone/utils';

import type { Money, TimeSeriesPoint } from '@mitdrone/types';

/** Chart series hold kobo. Charts plot naira and format ticks compactly. */
export const toNairaSeries = (series: TimeSeriesPoint[], key = 'value') =>
  series.map((p) => ({ date: p.date.slice(5), [key]: Math.round(p.value / 100) }));
export const compactNaira = (naira: number): string =>
  formatCompactMoney({ amount: naira * 100, currency: 'NGN' } satisfies Money);
