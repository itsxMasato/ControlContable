import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={monthLabel}
          tick={{ fill: 'var(--ink-soft)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--border-strong)' }}
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
        <Line type="monotone" dataKey="ingreso" stroke="var(--forest)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="gasto" stroke="var(--brick)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
