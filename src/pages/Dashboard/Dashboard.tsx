import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, ChevronRight, Flame, Landmark, PiggyBank, TrendingDown } from 'lucide-react';
import styles from './Dashboard.module.css';
import { useAppData } from '../../context/AppDataContext';
import { useActiveAccount } from '../../context/ActiveAccountContext';
import { useTheme } from '../../context/ThemeContext';
import { useAlerts } from '../../hooks/useAlerts';
import { useSavingsStreak } from '../../hooks/useSavingsStreak';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import FirstSteps from '../../components/tour/FirstSteps';
import { getIcon } from '../../components/ui/iconMap';
import SeverityIcon from '../../components/ui/SeverityIcon';
import EmptyState from '../../components/ui/EmptyState';
import CategoryDonutChart from '../../components/charts/CategoryDonutChart';
import MonthlyTrendLineChart from '../../components/charts/MonthlyTrendLineChart';
import BankBarChart from '../../components/charts/BankBarChart';
import {
  monthChangePct,
  monthExpenseTotal,
  monthlyTrend,
  netWorthBreakdown,
  spendByBankForMonth,
  spendByCategoryForMonth,
  totalConsolidatedBalance,
  totalSaved,
} from '../../utils/calculations';
import { addMonths, formatDateShort, monthKey, monthLabelLong, todayISO } from '../../utils/dates';
import { formatMoney } from '../../utils/currency';
import { resolveThemeColor } from '../../utils/chartPalette';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

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
  const patrimonio = netWorthBreakdown(banksInScope, transactions);
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
          <p className={styles.greetingDate}>
            {new Date().toLocaleDateString('es', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <h1 className="page-title">{greeting()}</h1>
          <p className="page-subtitle">Resumen de {monthLabelLong(currentMonth)}</p>
        </div>
      </div>

      <FirstSteps />

      <section
        className={styles.hero}
        data-tour="hero"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -5}deg`);
          e.currentTarget.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 7}deg`);
          e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
          e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.setProperty('--rx', '0deg');
          e.currentTarget.style.setProperty('--ry', '0deg');
        }}
      >
        <div className={styles.heroShine} aria-hidden="true" />
        <div className={styles.heroOrb} aria-hidden="true" />
        <div className={styles.heroOrb2} aria-hidden="true" />
        <div className={styles.heroLabel}>
          {activeBankId ? (banksInScope[0]?.nombre ?? 'Saldo') : patrimonio.deudas > 0 ? 'Patrimonio neto' : 'Saldo consolidado'}
        </div>
        <AnimatedNumber
          className={styles.heroValue}
          value={saldoConsolidado}
          format={(n) => formatMoney(n, currency)}
        />
        {patrimonio.deudas > 0 && (
          <div className={styles.heroBreakdown}>
            <span>
              Activos <strong>{formatMoney(patrimonio.activos, currency)}</strong>
            </span>
            <span className={styles.heroDot} />
            <span>
              Deudas <strong>{formatMoney(patrimonio.deudas, currency)}</strong>
            </span>
          </div>
        )}
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatIcon}>
              <TrendingDown size={16} />
            </span>
            <div>
              <div className={styles.heroStatLabel}>Gasto del mes</div>
              <AnimatedNumber
                className={styles.heroStatValue}
                value={gastoMes}
                format={(n) => formatMoney(n, currency)}
              />
              {pctChange !== null && (
                <span className={styles.heroDelta} data-good={pctChange <= 0}>
                  {pctChange >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(pctChange).toFixed(1)}% vs. mes anterior
                </span>
              )}
            </div>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatIcon}>
              <PiggyBank size={16} />
            </span>
            <div>
              <div className={styles.heroStatLabel}>Total ahorrado</div>
              <AnimatedNumber
                className={styles.heroStatValue}
                value={totalAhorrado}
                format={(n) => formatMoney(n, currency)}
              />
            </div>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatIcon}>
              <Landmark size={16} />
            </span>
            <div>
              <div className={styles.heroStatLabel}>Bancos activos</div>
              <span className={styles.heroStatValue}>{banks.length}</span>
            </div>
          </div>
        </div>
      </section>

      <div className={`grid ${styles.contentGrid}`}>
        <div className={`card ${styles.chartCard}`}>
          <div className="section-title">Tendencia de gasto (6 meses)</div>
          <div className={styles.chartBody}>
            <MonthlyTrendLineChart data={trendData} currency={currency} />
          </div>
        </div>
        <div className={`card ${styles.chartCard}`}>
          <div className="section-title">Gasto por categoría — este mes</div>
          <div className={styles.chartBody}>
            <CategoryDonutChart data={donutData} currency={currency} />
          </div>
        </div>
      </div>

      <div className={`grid ${styles.lowerGrid}`}>
        <div className={`card ${styles.chartCard}`}>
          <div className="section-title">Gasto por banco — este mes</div>
          <div className={styles.chartBody}>
            <BankBarChart data={bankBarData} currency={currency} />
          </div>
        </div>

        <div className={`${styles.rightColumn} stagger`}>
          <div className="card">
            <div className={styles.streakWrap}>
              <div className={styles.streakFlame}>
                <Flame size={22} strokeWidth={1.8} />
              </div>
              <div>
                <div className={styles.streakTitle}>
                  {streak} semana{streak === 1 ? '' : 's'} de racha
                </div>
                <div className="text-soft" style={{ fontSize: 13 }}>
                  Semanas consecutivas dentro de tu presupuesto
                </div>
              </div>
            </div>
          </div>

          <div className={`card ${styles.movementsCard}`}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 12,
              }}
            >
              <span className="section-title" style={{ marginBottom: 0 }}>
                Últimos movimientos
              </span>
              <Link to="/transacciones" className={styles.seeAll}>
                Ver todos <ChevronRight size={14} />
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
                    {(() => {
                      const color = bank
                        ? resolveThemeColor(bank.colorIndex, bank.id, accent, dark)
                        : 'var(--ink-faint)';
                      const Icon = getIcon(cat?.icono ?? '');
                      return (
                        <span
                          className="icon-tile"
                          style={{
                            background: `color-mix(in srgb, ${color} 15%, transparent)`,
                            color,
                          }}
                        >
                          <Icon size={18} strokeWidth={2} />
                        </span>
                      );
                    })()}
                    <div className={styles.movementMeta}>
                      <div className={styles.movementNote}>{t.nota || cat?.nombre}</div>
                      <div className="text-faint" style={{ fontSize: 12 }}>
                        {formatDateShort(t.fecha)} · {bank?.nombre}
                      </div>
                    </div>
                    <span
                      className={`mono ${t.tipo === 'gasto' ? 'text-expense' : 'text-income'}`}
                      style={{ fontWeight: 600 }}
                    >
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 12,
          }}
        >
          <span className="section-title" style={{ marginBottom: 0 }}>
            Alertas destacadas
          </span>
          <Link to="/alertas" className={styles.seeAll}>
            Ver todas <ChevronRight size={14} />
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
