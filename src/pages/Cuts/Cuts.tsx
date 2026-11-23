import { useMemo, useState } from 'react';
import { CalendarRange, ChevronDown, Scale, Scissors } from 'lucide-react';
import styles from './Cuts.module.css';
import { useAppData } from '../../context/AppDataContext';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import CutForm from '../../components/forms/CutForm';
import { computeCutPreview, lastCut } from '../../utils/cuts';
import { formatMoney } from '../../utils/currency';
import { formatDateShort, todayISO } from '../../utils/dates';
import { accountTypeInfo } from '../../utils/accounts';
import type { Cut } from '../../types';

function periodLabel(desde: string | null, hasta: string) {
  return desde ? `${formatDateShort(desde)} → ${formatDateShort(hasta)}` : `Inicio → ${formatDateShort(hasta)}`;
}

export default function Cuts() {
  const { data, deleteCut } = useAppData();
  const currency = data.settings.moneda;
  const cuts = useMemo(
    () => [...(data.cuts ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creadoEn.localeCompare(a.creadoEn)),
    [data.cuts]
  );
  const previous = lastCut(cuts);
  const [showForm, setShowForm] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const today = todayISO();
  const current = useMemo(
    () => computeCutPreview(data.banks, data.transactions, previous?.fecha ?? null, today),
    [data.banks, data.transactions, previous, today]
  );

  const bankKind = (bankId: string) => accountTypeInfo(data.banks.find((b) => b.id === bankId)?.tipo);

  const renderAccounts = (cut: Pick<Cut, 'cuentas'> | { cuentas: (typeof current)['cuentas'] }) => (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Cuenta</th>
            <th>Inicio</th>
            <th>Entradas</th>
            <th>Salidas</th>
            <th>Cierre</th>
          </tr>
        </thead>
        <tbody>
          {cut.cuentas.map((c) => {
            const liability = bankKind(c.bankId).liability;
            const fin = 'saldoReal' in c ? c.saldoReal : c.saldoSistema;
            const ajuste = 'ajuste' in c ? c.ajuste : 0;
            return (
              <tr key={c.bankId}>
                <td>
                  {c.nombre}
                  {liability && <span className={styles.tag}>deuda</span>}
                </td>
                <td className="mono">{formatMoney(liability ? -c.saldoInicioPeriodo : c.saldoInicioPeriodo, currency)}</td>
                <td className="mono text-income">+{formatMoney(c.ingresos, currency)}</td>
                <td className="mono text-expense">−{formatMoney(c.gastos, currency)}</td>
                <td className="mono" style={{ fontWeight: 800 }}>
                  {formatMoney(liability ? -fin : fin, currency)}
                  {Math.abs(ajuste) >= 0.01 && (
                    <span className={styles.adjust} title="Ajuste al conciliar con el saldo real">
                      {ajuste > 0 ? '+' : '−'}
                      {formatMoney(Math.abs(ajuste), currency)} ajuste
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cortes</h1>
          <p className="page-subtitle">Cerrá períodos cuando quieras y conciliá tus saldos con el banco</p>
        </div>
        <Button variant="primary" icon={<Scissors size={16} />} onClick={() => setShowForm(true)} data-tour="cut-add">
          Hacer corte
        </Button>
      </div>

      <section className={`card ${styles.current}`}>
        <div className={styles.currentHead}>
          <span className={styles.currentIcon}>
            <CalendarRange size={20} />
          </span>
          <div>
            <div className={styles.currentTitle}>Período actual</div>
            <div className="text-faint" style={{ fontSize: 12.5 }}>
              {previous ? `Desde el corte del ${formatDateShort(previous.fecha)} hasta hoy` : 'Desde que empezaste a usar la app'} ·{' '}
              {current.movimientos} movimiento{current.movimientos === 1 ? '' : 's'}
            </div>
          </div>
        </div>
        <div className={styles.stats}>
          <div>
            <span className={styles.statLabel}>Ingresos</span>
            <span className="mono text-income">{formatMoney(current.totales.ingresos, currency)}</span>
          </div>
          <div>
            <span className={styles.statLabel}>Gastos</span>
            <span className="mono text-expense">{formatMoney(current.totales.gastos, currency)}</span>
          </div>
          <div>
            <span className={styles.statLabel}>Ahorro neto</span>
            <span className={`mono ${current.totales.neto < 0 ? 'text-expense' : 'text-income'}`}>
              {formatMoney(current.totales.neto, currency)}
            </span>
          </div>
          <div>
            <span className={styles.statLabel}>Tasa de ahorro</span>
            <span className="mono">
              {current.totales.ingresos > 0 ? `${Math.round((current.totales.neto / current.totales.ingresos) * 100)}%` : '—'}
            </span>
          </div>
        </div>
        {data.banks.length > 0 && renderAccounts(current)}
      </section>

      <div className="section-title" style={{ marginTop: 'var(--space-5)' }}>
        Historial de cortes
      </div>

      {cuts.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Todavía no hiciste cortes"
            subtitle="Un corte cierra un período (una quincena, un mes o cuando quieras) y guarda tus saldos para comparar después."
            action={
              <Button variant="primary" icon={<Scissors size={16} />} onClick={() => setShowForm(true)}>
                Hacer mi primer corte
              </Button>
            }
          />
        </div>
      ) : (
        <div className={`${styles.history} stagger`}>
          {cuts.map((cut) => {
            const isOpen = open === cut.id;
            return (
              <article key={cut.id} className={`card ${styles.cut} ${isOpen ? styles.cutOpen : ''}`}>
                <button className={styles.cutHead} onClick={() => setOpen(isOpen ? null : cut.id)} aria-expanded={isOpen}>
                  <span className={styles.cutIcon}>
                    <Scissors size={17} />
                  </span>
                  <span className={styles.cutMeta}>
                    <span className={styles.cutTitle}>{cut.nombre || `Corte del ${formatDateShort(cut.fecha)}`}</span>
                    <span className="text-faint" style={{ fontSize: 12 }}>
                      {periodLabel(cut.desde, cut.fecha)}
                    </span>
                  </span>
                  <span className={`mono ${styles.cutNet} ${cut.totales.neto < 0 ? 'text-expense' : 'text-income'}`}>
                    {cut.totales.neto >= 0 ? '+' : '−'}
                    {formatMoney(Math.abs(cut.totales.neto), currency)}
                  </span>
                  <ChevronDown size={18} className={styles.chev} />
                </button>
                {isOpen && (
                  <div className={styles.cutBody}>
                    <div className={styles.stats}>
                      <div>
                        <span className={styles.statLabel}>Ingresos</span>
                        <span className="mono text-income">{formatMoney(cut.totales.ingresos, currency)}</span>
                      </div>
                      <div>
                        <span className={styles.statLabel}>Gastos</span>
                        <span className="mono text-expense">{formatMoney(cut.totales.gastos, currency)}</span>
                      </div>
                      <div>
                        <span className={styles.statLabel}>Neto</span>
                        <span className="mono">{formatMoney(cut.totales.neto, currency)}</span>
                      </div>
                      <div>
                        <span className={styles.statLabel}>Ajustes</span>
                        <span className="mono">
                          {Math.abs(cut.totales.ajustes) < 0.01
                            ? 'Cuadró'
                            : `${cut.totales.ajustes > 0 ? '+' : '−'}${formatMoney(Math.abs(cut.totales.ajustes), currency)}`}
                        </span>
                      </div>
                    </div>
                    {renderAccounts(cut)}
                    {cut.nota && <p className={styles.note}>{cut.nota}</p>}
                    <div className={styles.cutActions}>
                      {cut.id === previous?.id ? (
                        <Button
                          variant="danger"
                          size="small"
                          icon={<Scale size={14} />}
                          confirmText={
                            cut.ajusteTxIds.length > 0
                              ? `Eliminar corte y sus ${cut.ajusteTxIds.length} ajuste(s)`
                              : 'Tocá de nuevo para eliminar'
                          }
                          onClick={() => deleteCut(cut.id)}
                        >
                          Eliminar corte
                        </Button>
                      ) : (
                        <span className="text-faint" style={{ fontSize: 12 }}>
                          Solo se puede eliminar el último corte, para no romper la secuencia de períodos.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {showForm && <CutForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
