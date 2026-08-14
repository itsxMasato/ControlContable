import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Bank, Currency } from '../../types';
import { formatCompactMoney, formatMoney } from '../../utils/currency';
import { useTheme } from '../../context/ThemeContext';
import { resolveThemeColor } from '../../utils/chartPalette';
import ChartTooltip from './ChartTooltip';
import EmptyState from '../ui/EmptyState';

export default function BankBarChart({
  data,
  currency,
}: {
  data: { bank: Bank; total: number }[];
  currency: Currency;
}) {
  const { accent, dark } = useTheme();

  if (data.every((d) => d.total === 0)) {
    return <EmptyState title="Sin gastos por banco" subtitle="Registrá movimientos para comparar el gasto entre tus cuentas." />;
  }

  const chartData = data.map((d) => ({
    name: d.bank.nombre,
    total: d.total,
    color: resolveThemeColor(d.bank.colorIndex, d.bank.id, accent, dark),
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: 'var(--ink)', fontSize: 12.5, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          width={130}
        />
        <Tooltip
          cursor={{ fill: 'var(--gold-soft)' }}
          content={({ active, payload }) => (
            <ChartTooltip active={active}>
              {payload?.[0] && <span className="mono">{formatMoney(payload[0].value as number, currency)}</span>}
            </ChartTooltip>
          )}
        />
        <Bar
          dataKey="total"
          radius={[0, 6, 6, 0]}
          barSize={20}
          label={{
            position: 'right',
            formatter: ((v: unknown) => formatCompactMoney(Number(v ?? 0), currency)) as (value: unknown) => string,
            fill: 'var(--ink-soft)',
            fontSize: 11,
          }}
        >
          {chartData.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
