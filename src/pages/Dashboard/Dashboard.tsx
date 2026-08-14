import { Link } from 'react-router-dom';
import { Flame, Landmark, PiggyBank, Wallet } from 'lucide-react';
import styles from './Dashboard.module.css';
import { useAppData } from '../../context/AppDataContext';
import { useActiveAccount } from '../../context/ActiveAccountContext';
import { useTheme } from '../../context/ThemeContext';
import { useAlerts } from '../../hooks/useAlerts';
import { useSavingsStreak } from '../../hooks/useSavingsStreak';
import MetricCard from '../../components/ui/MetricCard';
import SeverityIcon from '../../components/ui/SeverityIcon';
import EmptyState from '../../components/ui/EmptyState';
import CategoryDonutChart from '../../components/charts/CategoryDonutChart';
import MonthlyTrendLineChart from '../../components/charts/MonthlyTrendLineChart';
import BankBarChart from '../../components/charts/BankBarChart';
import {
  monthChangePct,
  monthExpenseTotal,
  monthlyTrend,
  spendByBankForMonth,
  spendByCategoryForMonth,
  totalConsolidatedBalance,
  totalSaved,
} from '../../utils/calculations';
import { addMonths, formatDateShort, monthKey, monthLabelLong, todayISO } from '../../utils/dates';
import { formatMoney } from '../../utils/currency';
import { resolveThemeColor } from '../../utils/chartPalette';

export default function Dashboard() {
  const { data } = useAppData();
  const { activeBankId } = useActiveAccount();
  const { accent, dark } = useTheme();
  const alerts = useAlerts();
  const streak = useSavingsStreak();
  const { banks, categories, transactions, savingsGoals, settings } = data;
  const currency = settings.moneda;

  const banksInScope = activeBankId ? banks.filter((b) => b.id === activeBankId) : banks;
  const txInScope = activeBankId ? transactions.filter((t) => t.bankId === activeBankId) : transactions;

  const currentMonth = monthKey(todayISO());
  const prevMonth = addMonths(currentMonth, -1);

  const saldoConsolidado = totalConsolidatedBalance(banksInScope, transactions);
  const gastoMes = monthExpenseTotal(txInScope, currentMonth);
  const gastoMesPrev = monthExpenseTotal(txInScope, prevMonth);
  const pctChange = monthChangePct(gastoMes, gastoMesPrev);
  const totalAhorrado = totalSaved(savingsGoals);

  const donutData = spendByCategoryForMonth(txInScope, categories, currentMonth);
  const trendData = monthlyTrend(transactions, 6, activeBankId);
  const bankBarData = spendByBankForMonth(banks, transactions, currentMonth);

  const recentMovements = [...txInScope].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 6);

  const highlightedAlerts = [...alerts].sort((a) => (a.severidad === 'advertencia' ? -1 : 1)).slice(0, 3);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resumen</h1>
          <p className="page-subtitle">{monthLabelLong(currentMonth)}</p>
        </div>
      </div>

      <div className={`grid ${styles.metricsGrid}`}>
        <MetricCard label="Saldo consolidado" value={formatMoney(saldoConsolidado, currency)} icon={<Wallet size={16} className="text-faint" />} />
        <MetricCard
          label="Gasto del mes"
          value={formatMoney(gastoMes, currency)}
          delta={pctChange !== null ? { pct: pctChange, caption: 'vs. mes anterior' } : null}
          deltaGoodDirection="down"
        />
        <MetricCard label="Total ahorrado" value={formatMoney(totalAhorrado, currency)} icon={<PiggyBank size={16} className="text-faint" />} />
        <MetricCard label="Bancos activos" value={String(banks.length)} icon={<Landmark size={16} className="text-faint" />} />
      </div>

      <div className={`grid ${styles.contentGrid}`}>
        <div className="card">
          <div className="section-title">Tendencia de gasto (6 meses)</div>
          <MonthlyTrendLineChart data={trendData} currency={currency} />
        </div>
        <div className="card">
          <div className="section-title">Gasto por categoría — este mes</div>
          <CategoryDonutChart data={donutData} currency={currency} />
        </div>
      </div>

      <div className={`grid ${styles.lowerGrid}`}>
        <div className="card">
          <div className="section-title">Gasto por banco — este mes</div>
          <BankBarChart data={bankBarData} currency={currency} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card">
            <div className={styles.streakWrap}>
              <div className={styles.streakFlame}>
                <Flame size={22} strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600 }}>
                  {streak} semana{streak === 1 ? '' : 's'} de racha
                </div>
                <div className="text-soft" style={{ fontSize: 13 }}>
                  Semanas consecutivas dentro de tu presupuesto
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <span className="section-title" style={{ marginBottom: 0 }}>
                Últimos movimientos
              </span>
              <Link to="/transacciones" style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>
                Ver todos
              </Link>
            </div>
            {recentMovements.length === 0 ? (
              <EmptyState title="Sin movimientos" subtitle="Registrá tu primera transacción para verla aquí." />
            ) : (
              recentMovements.map((t) => {
                const bank = banks.find((b) => b.id === t.bankId);
                const cat = categories.find((c) => c.id === t.categoryId);
                return (
                  <div key={t.id} className={styles.movementRow}>
                    <span
                      className={styles.movementDot}
                      style={{ background: bank ? resolveThemeColor(bank.colorIndex, bank.id, accent, dark) : undefined }}
                    />
                    <div className={styles.movementMeta}>
                      <div className={styles.movementNote}>{t.nota || cat?.nombre}</div>
                      <div className="text-faint" style={{ fontSize: 12 }}>
                        {formatDateShort(t.fecha)} · {bank?.nombre}
                      </div>
                    </div>
                    <span className={`mono ${t.tipo === 'gasto' ? 'text-expense' : 'text-income'}`} style={{ fontWeight: 600 }}>
                      {t.tipo === 'gasto' ? '-' : '+'}
                      {formatMoney(t.monto, currency)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <span className="section-title" style={{ marginBottom: 0 }}>
            Alertas destacadas
          </span>
          <Link to="/alertas" style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>
            Ver todas
          </Link>
        </div>
        {highlightedAlerts.length === 0 ? (
          <EmptyState title="Todo en orden" subtitle="No hay alertas activas por el momento." />
        ) : (
          highlightedAlerts.map((a) => (
            <div key={a.id} className={styles.alertRow}>
              <SeverityIcon severity={a.severidad} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.titulo}</div>
                <div className="text-soft" style={{ fontSize: 13 }}>
                  {a.descripcion}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
