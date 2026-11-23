import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Currency } from '../../types';
import { formatCompactMoney, formatMoney } from '../../utils/currency';
import { monthLabel } from '../../utils/dates';
import ChartTooltip from './ChartTooltip';

export default function MonthlyTrendLineChart({
  data,
  currency,
}: {
  data: { month: string; gasto: number; ingreso: number }[];
  currency: Currency;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="trendIngreso" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--forest)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--forest)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="trendGasto" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brick)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--brick)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={monthLabel}
          tick={{ fill: 'var(--ink-soft)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatCompactMoney(v, currency)}
          tick={{ fill: 'var(--ink-soft)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip
          cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '4 4' }}
          content={({ active, payload, label }) => {
            if (!active || !label) return null;
            return (
              <ChartTooltip active={active}>
                <div style={{ marginBottom: 4, fontWeight: 600 }}>{monthLabel(label as string)}</div>
                {payload?.map((p) => (
                  <div key={p.dataKey as string} style={{ color: p.dataKey === 'gasto' ? 'var(--brick)' : 'var(--forest)' }}>
                    {p.dataKey === 'gasto' ? 'Gasto' : 'Ingreso'}:{' '}
                    <span className="mono">{formatMoney(p.value as number, currency)}</span>
                  </div>
                ))}
              </ChartTooltip>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="ingreso"
          stroke="var(--forest)"
          strokeWidth={2.5}
          fill="url(#trendIngreso)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 3, stroke: 'var(--card)' }}
          animationDuration={1100}
        />
        <Area
          type="monotone"
          dataKey="gasto"
          stroke="var(--brick)"
          strokeWidth={2.5}
          fill="url(#trendGasto)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 3, stroke: 'var(--card)' }}
          animationDuration={1100}
          animationBegin={150}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
