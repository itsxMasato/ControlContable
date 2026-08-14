import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Category } from '../../types';
import { formatMoney } from '../../utils/currency';
import type { Currency } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { resolveThemeColor } from '../../utils/chartPalette';
import ChartTooltip from './ChartTooltip';
import EmptyState from '../ui/EmptyState';

export default function CategoryDonutChart({
  data,
  currency,
}: {
  data: { category: Category; total: number }[];
  currency: Currency;
}) {
  const { accent, dark } = useTheme();

  if (data.length === 0) {
    return <EmptyState title="Sin gastos este mes" subtitle="Cuando registres movimientos verás aquí el desglose por categoría." />;
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ width: 180, height: 180, flexShrink: 0, position: 'relative' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey={(d: { category: Category }) => d.category.nombre}
              innerRadius={54}
              outerRadius={82}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((d) => (
                <Cell key={d.category.id} fill={resolveThemeColor(d.category.colorIndex, d.category.id, accent, dark)} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => (
                <ChartTooltip active={active}>
                  {payload?.[0] && (
                    <span>
                      <strong>{(payload[0].payload as { category: Category }).category.nombre}</strong>
                      <br />
                      <span className="mono">{formatMoney(payload[0].value as number, currency)}</span>
                    </span>
                  )}
                </ChartTooltip>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span className="text-faint" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total
          </span>
          <span className="mono" style={{ fontWeight: 600, fontSize: 14 }}>
            {formatMoney(total, currency)}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 180 }}>
        {data.map((d) => (
          <div key={d.category.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: resolveThemeColor(d.category.colorIndex, d.category.id, accent, dark),
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1 }}>{d.category.nombre}</span>
            <span className="mono text-soft">{formatMoney(d.total, currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
