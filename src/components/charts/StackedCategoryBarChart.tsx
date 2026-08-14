import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Currency } from '../../types';
import { formatCompactMoney, formatMoney } from '../../utils/currency';
import { monthLabel } from '../../utils/dates';
import ChartTooltip from './ChartTooltip';

export default function StackedCategoryBarChart({
  data,
  series,
  currency,
}: {
  data: Record<string, string | number>[];
  series: { key: string; label: string; color: string }[];
  currency: Currency;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={(v) => monthLabel(v as string)}
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
                {payload
                  ?.filter((p) => (p.value as number) > 0)
                  .map((p) => (
                    <div key={p.dataKey as string}>
                      {series.find((s) => s.key === p.dataKey)?.label}:{' '}
                      <span className="mono">{formatMoney(p.value as number, currency)}</span>
                    </div>
                  ))}
              </ChartTooltip>
            );
          }}
        />
        <Legend
          formatter={(value) => <span style={{ color: 'var(--ink-soft)', fontSize: 12 }}>{value}</span>}
          iconType="circle"
          iconSize={8}
        />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={s.color} radius={[0, 0, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
