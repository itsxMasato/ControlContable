import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import styles from './Reports.module.css';
import { useAppData } from '../../context/AppDataContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import StackedCategoryBarChart from '../../components/charts/StackedCategoryBarChart';
import { categorySpendByMonth, monthIncomeTotal, monthExpenseTotal, subcategoryIds } from '../../utils/calculations';
import { formatMoney } from '../../utils/currency';
import { downloadCsv } from '../../utils/csvExport';
import { resolveThemeColor } from '../../utils/chartPalette';
import { lastNMonthKeys, monthLabel, monthLabelLong } from '../../utils/dates';

type Period = 'mensual' | 'anual';

export default function Reports() {
  const { data } = useAppData();
  const { categories, transactions, settings } = data;
  const { accent, dark } = useTheme();
  const [period, setPeriod] = useState<Period>('mensual');

  const topCategories = categories.filter((c) => c.parentId === null);
  const months = lastNMonthKeys(12);

  const monthlySeries = useMemo(
    () =>
      months.map((mKey) => {
        const row: Record<string, string | number> = { month: mKey };
        for (const cat of topCategories) {
          row[cat.id] = categorySpendByMonth(transactions, cat.id, mKey, subcategoryIds(categories, cat.id));
        }
        return row;
      }),
    [months, topCategories, transactions, categories]
  );

  const years = Array.from(new Set(months.map((m) => m.slice(0, 4))));
  const annualSeries = useMemo(
    () =>
      years.map((year) => {
        const row: Record<string, string | number> = { month: `${year}-01` };
        for (const cat of topCategories) {
          const subIds = subcategoryIds(categories, cat.id);
          let total = 0;
          for (let m = 1; m <= 12; m++) {
            total += categorySpendByMonth(transactions, cat.id, `${year}-${String(m).padStart(2, '0')}`, subIds);
          }
          row[cat.id] = total;
        }
        return row;
      }),
    [years, topCategories, transactions, categories]
  );

  const series = topCategories.map((c) => ({
    key: c.id,
    label: c.nombre,
    color: resolveThemeColor(c.colorIndex, c.id, accent, dark),
  }));
  const chartData = period === 'mensual' ? monthlySeries : annualSeries;

  const summaryRows = months.map((mKey) => ({
    month: mKey,
    ingreso: monthIncomeTotal(transactions, mKey),
    gasto: monthExpenseTotal(transactions, mKey),
  }));

  const handleExport = () => {
    downloadCsv(
      `libro-de-gastos-reporte-${period}.csv`,
      ['Mes', 'Ingresos', 'Gastos', 'Neto'],
      summaryRows.map((r) => [monthLabelLong(r.month), r.ingreso.toFixed(2), r.gasto.toFixed(2), (r.ingreso - r.gasto).toFixed(2)])
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Comparativo de ingresos y gastos por categoría</p>
        </div>
        <Button variant="secondary" icon={<Download size={16} />} onClick={handleExport}>
          Exportar CSV
        </Button>
      </div>

      <div className={styles.toggleRow}>
        <button
          className={`${styles.toggleBtn} ${period === 'mensual' ? styles.toggleBtnActive : ''}`}
          onClick={() => setPeriod('mensual')}
        >
          Mensual
        </button>
        <button
          className={`${styles.toggleBtn} ${period === 'anual' ? styles.toggleBtnActive : ''}`}
          onClick={() => setPeriod('anual')}
        >
          Anual
        </button>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="section-title">Gasto por categoría en el tiempo</div>
        <StackedCategoryBarChart data={chartData} series={series} currency={settings.moneda} />
      </div>

      <div className="card">
        <div className="section-title">Tabla resumen</div>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mes</th>
                <th>Ingresos</th>
                <th>Gastos</th>
                <th>Neto</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((r) => (
                <tr key={r.month}>
                  <td>{monthLabel(r.month)}</td>
                  <td className="mono text-income">{formatMoney(r.ingreso, settings.moneda)}</td>
                  <td className="mono text-expense">{formatMoney(r.gasto, settings.moneda)}</td>
                  <td className="mono" style={{ fontWeight: 700 }}>
                    {formatMoney(r.ingreso - r.gasto, settings.moneda)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
