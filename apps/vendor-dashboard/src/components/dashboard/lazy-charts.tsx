'use client';

import { Skeleton } from '@mitdrone/ui';
import dynamic from 'next/dynamic';

const loading = () => <Skeleton className="h-72 w-full" />;

/** Recharts is heavy: load it only on the pages that draw charts. */
export const TimeSeriesChart = dynamic(
  () => import('@mitdrone/ui/charts').then((m) => m.TimeSeriesChart),
  { ssr: false, loading },
);
export const BarSeriesChart = dynamic(
  () => import('@mitdrone/ui/charts').then((m) => m.BarSeriesChart),
  { ssr: false, loading },
);
export const DonutChart = dynamic(() => import('@mitdrone/ui/charts').then((m) => m.DonutChart), {
  ssr: false,
  loading,
});
