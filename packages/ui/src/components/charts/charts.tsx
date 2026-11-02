'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { cn } from '../../lib/cn';

export interface ChartSeries {
  key: string;
  label: string;
  /** CSS color. Defaults to the chart palette tokens. */
  color?: string;
}

const PALETTE = [1, 2, 3, 4, 5].map((n) => `hsl(var(--chart-${n}))`);
const colorAt = (index: number) => PALETTE[index % PALETTE.length] ?? PALETTE[0]!;

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  color: 'hsl(var(--popover-foreground))',
  fontSize: 12,
  boxShadow: '0 12px 32px hsl(var(--shadow) / 0.14)',
};
const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 },
} as const;

interface BaseChartProps {
  data: Record<string, string | number>[];
  series: ChartSeries[];
  xKey?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
  /** Accessible summary, since charts are not readable by screen readers. */
  ariaLabel: string;
  className?: string;
}

export function TimeSeriesChart({
  data,
  series,
  xKey = 'date',
  height = 288,
  valueFormatter,
  ariaLabel,
  className,
}: BaseChartProps) {
  return (
    <div role="img" aria-label={ariaLabel} className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey={xKey} {...axisProps} minTickGap={24} />
          <YAxis {...axisProps} width={56} tickFormatter={valueFormatter} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => (valueFormatter ? valueFormatter(Number(value)) : String(value))}
          />
          {series.length > 1 ? <Legend /> : null}
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? colorAt(i)}
              fill={s.color ?? colorAt(i)}
              fillOpacity={0.12}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarSeriesChart({
  data,
  series,
  xKey = 'name',
  height = 288,
  valueFormatter,
  ariaLabel,
  className,
}: BaseChartProps) {
  return (
    <div role="img" aria-label={ariaLabel} className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} width={56} tickFormatter={valueFormatter} />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            contentStyle={tooltipStyle}
            formatter={(value) => (valueFormatter ? valueFormatter(Number(value)) : String(value))}
          />
          {series.length > 1 ? <Legend /> : null}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color ?? colorAt(i)}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({
  data,
  height = 240,
  ariaLabel,
  className,
}: {
  data: { name: string; value: number }[];
  height?: number;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="img" aria-label={ariaLabel} className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="60%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={colorAt(i)} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
