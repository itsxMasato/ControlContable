import { useState } from 'react';
import { ChevronDown, ChevronRight, Link2, Plus } from 'lucide-react';
import styles from './Banks.module.css';
import { useAppData } from '../../context/AppDataContext';
import { useTheme } from '../../context/ThemeContext';
import { getIcon } from '../../components/ui/iconMap';
import Sparkline from '../../components/charts/Sparkline';
import Badge from '../../components/ui/Badge';
import BankForm from '../../components/forms/BankForm';
import AllocationForm from '../../components/forms/AllocationForm';
import { bankAllocatedTotal, bankAvailable, bankBalance, monthExpenseTotal } from '../../utils/calculations';
import { formatMoney } from '../../utils/currency';
import { resolveThemeColor } from '../../utils/chartPalette';
import { lastNMonthKeys, monthKey } from '../../utils/dates';
import type { Allocation, Bank } from '../../types';
import { accountTypeInfo } from '../../utils/accounts';
import ProgressBar from '../../components/ui/ProgressBar';

export default function Banks() {
  const { data } = useAppData();
  const { banks, transactions, allocations, settings, categories } = data;
  const { accent, dark } = useTheme();
  const [editing, setEditing] = useState<Bank | 'new' | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [allocationTarget, setAllocationTarget] = useState<{ bank: Bank; existing?: Allocation } | null>(null);

  const currentMonth = monthKey(new Date().toISOString().slice(0, 10));

  const sparklineFor = (bank: Bank) => {
    const months = lastNMonthKeys(6);
    return months.map((mKey) => {
      const endOfMonth = `${mKey}-31`;
      const txUpTo = transactions.filter((t) => t.bankId === bank.id && t.fecha <= endOfMonth);
      const delta = txUpTo.reduce((sum, t) => sum + (t.tipo === 'ingreso' ? t.monto : -t.monto), 0);
      return { value: bank.saldoInicial + delta };
    });
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bancos / Cuentas</h1>
          <p className="page-subtitle">{banks.length} cuenta{banks.length === 1 ? '' : 's'} registrada{banks.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className={`grid stagger ${styles.grid}`}>
        {banks.map((bank, bankIndex) => {
          const Icon = getIcon(bank.icono);
          const bankColor = resolveThemeColor(bank.colorIndex, bank.id, accent, dark);
          const saldo = bankBalance(bank, transactions);
          const gastoMes = monthExpenseTotal(transactions, currentMonth, bank.id);
          const apartado = bankAllocatedTotal(bank.id, allocations);
          const disponible = bankAvailable(bank, transactions, allocations);
          const bankAllocations = allocations.filter((a) => a.bankId === bank.id);
          const isOpen = expanded.has(bank.id);
          const tipoInfo = accountTypeInfo(bank.tipo);
          const deuda = tipoInfo.liability ? Math.max(0, -saldo) : 0;

          return (
            <div key={bank.id} className="card">
              <div className={styles.cardHeader} onClick={() => setEditing(bank)} style={{ cursor: 'pointer' }}>
                <div className={styles.iconWrap} style={{ background: `${bankColor}22`, color: bankColor }}>
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <div className={styles.bankName}>{bank.nombre}</div>
                  <div className={styles.bankType}>{tipoInfo.label}</div>
                </div>
              </div>

              <div className={styles.statsRow}>
                <div>
                  <div className={styles.statLabel}>{tipoInfo.liability ? 'Deuda' : 'Saldo'}</div>
                  <div className={styles.statValue} style={tipoInfo.liability && deuda > 0 ? { color: 'var(--brick)' } : undefined}>
                    {formatMoney(tipoInfo.liability ? deuda : saldo, settings.moneda)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={styles.statLabel}>Disponible</div>
                  <div className={styles.statValue} style={{ color: disponible < 0 ? 'var(--brick)' : 'var(--forest)' }}>
                    {formatMoney(disponible, settings.moneda)}
                  </div>
                </div>
              </div>

              <div className={`${styles.statsRow} ${styles.statsRowSecondary}`}>
                <div>
                  <div className={styles.statLabelSmall}>Gasto del mes</div>
                  <div className={styles.statValueSmall} style={{ color: 'var(--brick)' }}>
                    {formatMoney(gastoMes, settings.moneda)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={styles.statLabelSmall}>Apartado</div>
                  <div className={styles.statValueSmall} style={{ color: 'var(--gold)' }}>
                    {formatMoney(apartado, settings.moneda)}
                  </div>
                </div>
              </div>

              {bank.tipo === 'credito' && bank.limiteCredito ? (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 6 }}>
                    <span className="text-faint">Uso del crédito</span>
                    <span
                      className="mono"
                      style={{ fontWeight: 700, color: deuda / bank.limiteCredito > 0.3 ? 'var(--brick)' : 'var(--forest)' }}
                    >
                      {Math.round((deuda / bank.limiteCredito) * 100)}% de {formatMoney(bank.limiteCredito, settings.moneda)}
                    </span>
                  </div>
                  <ProgressBar
                    value={deuda}
                    max={bank.limiteCredito}
                    color={deuda / bank.limiteCredito > 0.3 ? 'var(--brick)' : 'var(--forest)'}
                  />
                  {deuda / bank.limiteCredito > 0.3 && (
                    <p className="text-faint" style={{ fontSize: 11.5, marginTop: 6 }}>
                      Se recomienda usar menos del 30% del límite para cuidar tu historial crediticio.
                    </p>
                  )}
                </div>
              ) : null}

              <Sparkline data={sparklineFor(bank)} color={bankColor} />

              <div className={styles.allocationsSection} data-tour={bankIndex === 0 ? 'allocations' : undefined}>
                <button className={styles.allocationsToggle} onClick={() => toggleExpanded(bank.id)}>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  Apartados {bankAllocations.length > 0 && `(${bankAllocations.length})`}
                </button>
                {isOpen && (
                  <div className={styles.allocationsList}>
                    {bankAllocations.length === 0 ? (
                      <p className="text-faint" style={{ fontSize: 12.5, padding: '4px 0' }}>
                        Sin apartados todavía.
                      </p>
                    ) : (
                      bankAllocations.map((a) => (
                        <div
                          key={a.id}
                          className={styles.allocationRow}
                          onClick={() => setAllocationTarget({ bank, existing: a })}
                        >
                          <div>
                            <div className={styles.allocationName} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {a.nombre}
                              {a.recurringPaymentId && <Badge tone="slate">Automático</Badge>}
                              {a.recurrente && <Badge tone="forest">Mensual</Badge>}
                              {a.recurrente && a.monto <= 0 && <Badge tone="neutral">Pagado este mes</Badge>}
                            </div>
                            {a.categoryId && categories.some((c) => c.id === a.categoryId) && (
                              <div className="text-faint" style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                                {(() => {
                                  const cat = categories.find((c) => c.id === a.categoryId)!;
                                  const CatIcon = getIcon(cat.icono);
                                  return (
                                    <>
                                      <Link2 size={11} />
                                      <CatIcon size={12} />
                                      {cat.nombre}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                            {a.nota && <div className="text-faint" style={{ fontSize: 11.5 }}>{a.nota}</div>}
                          </div>
                          <span className="mono" style={{ fontWeight: 600, color: 'var(--gold)' }}>
                            {formatMoney(a.monto, settings.moneda)}
                          </span>
                        </div>
                      ))
                    )}
                    <button className={styles.addAllocationBtn} onClick={() => setAllocationTarget({ bank })}>
                      <Plus size={13} />
                      Apartar monto
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <button className={styles.addCard} onClick={() => setEditing('new')} data-tour="banks-add">
          <Plus size={18} />
          Agregar banco / cuenta
        </button>
      </div>

      {editing && <BankForm onClose={() => setEditing(null)} existing={editing === 'new' ? undefined : editing} />}
      {allocationTarget && (
        <AllocationForm
          onClose={() => setAllocationTarget(null)}
          bank={allocationTarget.bank}
          existing={allocationTarget.existing}
        />
      )}
    </div>
  );
}
