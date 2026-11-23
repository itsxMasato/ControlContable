import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, Plus, Search, SlidersHorizontal } from 'lucide-react';
import styles from './Transactions.module.css';
import { useAppData } from '../../context/AppDataContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import TransactionForm from '../../components/forms/TransactionForm';
import TransferForm from '../../components/forms/TransferForm';
import { formatDateShort, todayISO } from '../../utils/dates';
import { getIcon } from '../../components/ui/iconMap';
import { formatMoney } from '../../utils/currency';
import { resolveThemeColor } from '../../utils/chartPalette';
import type { Transaction } from '../../types';

export default function Transactions() {
  const { data } = useAppData();
  const { banks, categories, transactions, settings } = data;
  const { accent, dark } = useTheme();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('buscar') ?? '');
  const [bankId, setBankId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editing, setEditing] = useState<Transaction | 'new' | null>(null);
  const [transferEditing, setTransferEditing] = useState<Transaction | 'new' | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const topCategories = categories.filter((c) => c.parentId === null);

  const categoryLabel = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return '—';
    if (cat.parentId) {
      const parent = categories.find((c) => c.id === cat.parentId);
      return `${parent?.nombre ?? ''} › ${cat.nombre}`;
    }
    return cat.nombre;
  };

  const categoryMatchesFilter = (txCategoryId: string) => {
    if (!categoryId) return true;
    if (txCategoryId === categoryId) return true;
    const cat = categories.find((c) => c.id === txCategoryId);
    return cat?.parentId === categoryId;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...transactions]
      .filter((t) => {
        if (bankId && t.bankId !== bankId) return false;
        if (!categoryMatchesFilter(t.categoryId)) return false;
        if (dateFrom && t.fecha < dateFrom) return false;
        if (dateTo && t.fecha > dateTo) return false;
        if (q) {
          const cat = categories.find((c) => c.id === t.categoryId);
          const bank = banks.find((b) => b.id === t.bankId);
          const haystack = `${t.nota} ${cat?.nombre ?? ''} ${bank?.nombre ?? ''}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [transactions, bankId, categoryId, dateFrom, dateTo, search, categories, banks]);

  const hasAnyData = transactions.length > 0;

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const list = map.get(t.fecha) ?? [];
      list.push(t);
      map.set(t.fecha, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const dayLabel = (iso: string) => {
    const today = todayISO();
    const y = new Date(today + 'T00:00:00');
    y.setDate(y.getDate() - 1);
    const yesterday = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    if (iso === today) return 'Hoy';
    if (iso === yesterday) return 'Ayer';
    return new Date(iso + 'T00:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const openTx = (t: Transaction) => (t.transferId ? setTransferEditing(t) : setEditing(t));
  const activeFilterCount = [bankId, categoryId, dateFrom, dateTo].filter(Boolean).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transacciones</h1>
          <p className="page-subtitle">{filtered.length} movimiento{filtered.length === 1 ? '' : 's'}</p>
        </div>
        <div className={styles.headerActions}>
          {banks.length >= 2 && (
            <Button variant="secondary" icon={<ArrowLeftRight size={16} />} onClick={() => setTransferEditing('new')}>
              Transferir
            </Button>
          )}
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setEditing('new')}>
            Nueva transacción
          </Button>
        </div>
      </div>

      <div className={styles.searchRow} data-tour="tx-search">
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.filterInput}
            type="text"
            placeholder="Buscar por nota, banco, categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={`${styles.filterToggle} ${showFilters ? styles.filterToggleOn : ''}`}
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-label="Filtros"
        >
          <SlidersHorizontal size={17} />
          {activeFilterCount > 0 && <span className={styles.filterCount}>{activeFilterCount}</span>}
        </button>
      </div>

      <div className={`${styles.filters} ${showFilters ? styles.filtersOpen : ''}`}>
        <select className={styles.filterSelect} value={bankId} onChange={(e) => setBankId(e.target.value)}>
          <option value="">Todos los bancos</option>
          {banks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nombre}
            </option>
          ))}
        </select>
        <select className={styles.filterSelect} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Todas las categorías</option>
          {topCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <input className={styles.filterInput} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <span className={`text-faint ${styles.dateSep}`}>a</span>
        <input className={styles.filterInput} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title={hasAnyData ? 'Sin resultados' : 'Aún no hay movimientos'}
            subtitle={
              hasAnyData
                ? 'Ajustá los filtros o el rango de fechas para ver más transacciones.'
                : 'Registrá tu primer movimiento para empezar a llevar el control de tus gastos e ingresos.'
            }
            action={
              !hasAnyData ? (
                <Button variant="primary" icon={<Plus size={16} />} onClick={() => setEditing('new')}>
                  Registrar movimiento
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
        <div className={styles.mobileList}>
          {groups.map(([fecha, items]) => {
            const dayTotal = items.reduce((acc, t) => acc + (t.tipo === 'gasto' ? -t.monto : t.monto), 0);
            return (
              <section key={fecha} className={styles.dayGroup}>
                <div className={styles.dayHeader}>
                  <span>{dayLabel(fecha)}</span>
                  <span className={`mono ${dayTotal < 0 ? 'text-expense' : 'text-income'}`}>
                    {dayTotal < 0 ? '-' : '+'}
                    {formatMoney(Math.abs(dayTotal), settings.moneda)}
                  </span>
                </div>
                <div className={styles.dayCard}>
                  {items.map((t) => {
                    const bank = banks.find((b) => b.id === t.bankId);
                    const cat = categories.find((c) => c.id === t.categoryId);
                    const color = bank ? resolveThemeColor(bank.colorIndex, bank.id, accent, dark) : 'var(--ink-faint)';
                    const Icon = t.transferId ? ArrowLeftRight : getIcon(cat?.icono ?? '');
                    return (
                      <button key={t.id} type="button" className={styles.txRow} onClick={() => openTx(t)}>
                        <span className="icon-tile" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
                          <Icon size={18} strokeWidth={2} />
                        </span>
                        <span className={styles.txMeta}>
                          <span className={styles.txTitle}>{t.nota || categoryLabel(t.categoryId)}</span>
                          <span className={styles.txSub}>
                            {t.nota ? `${categoryLabel(t.categoryId)} · ` : ''}
                            {bank?.nombre ?? '—'}
                            {t.cuotaGrupoId ? ` · Cuota ${t.cuotaNumero}/${t.cuotaTotalCuotas}` : ''}
                            {t.apartado ? ` · De apartado "${t.apartado.nombre}"` : ''}
                          </span>
                        </span>
                        <span className={`mono ${styles.txAmount} ${t.tipo === 'gasto' ? 'text-expense' : 'text-income'}`}>
                          {t.tipo === 'gasto' ? '-' : '+'}
                          {formatMoney(t.monto, settings.moneda)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
        <div className={styles.tableWrap}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Banco</th>
                  <th>Categoría › Subcategoría</th>
                  <th>Nota</th>
                  <th style={{ textAlign: 'right' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const bank = banks.find((b) => b.id === t.bankId);
                  const bankColor = bank ? resolveThemeColor(bank.colorIndex, bank.id, accent, dark) : 'transparent';
                  const partnerLeg = t.transferId
                    ? transactions.find((o) => o.transferId === t.transferId && o.id !== t.id)
                    : undefined;
                  const partnerBank = partnerLeg ? banks.find((b) => b.id === partnerLeg.bankId) : undefined;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => openTx(t)}
                      style={{ boxShadow: `inset 3px 0 0 ${bankColor}` }}
                    >
                      <td className="mono text-soft">{formatDateShort(t.fecha)}</td>
                      <td>
                        <span className={styles.bankCell}>
                          <span className={styles.bankDot} style={{ background: bankColor }} />
                          {bank?.nombre ?? '—'}
                        </span>
                      </td>
                      <td className="text-soft">{categoryLabel(t.categoryId)}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {t.transferId && partnerBank && (
                            <Badge tone="gold">{t.tipo === 'gasto' ? `→ ${partnerBank.nombre}` : `← ${partnerBank.nombre}`}</Badge>
                          )}
                          {t.cuotaGrupoId && <Badge tone="slate">Cuota {t.cuotaNumero}/{t.cuotaTotalCuotas}</Badge>}
                          {t.apartado && <Badge tone="gold">Apartado: {t.apartado.nombre}</Badge>}
                          {t.nota || (!t.transferId && !t.cuotaGrupoId && '—')}
                        </span>
                      </td>
                      <td className={`${styles.amountCell} mono ${t.tipo === 'gasto' ? 'text-expense' : 'text-income'}`}>
                        {t.tipo === 'gasto' ? '-' : '+'}
                        {formatMoney(t.monto, settings.moneda)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {editing && (
        <TransactionForm onClose={() => setEditing(null)} existing={editing === 'new' ? undefined : editing} />
      )}
      {transferEditing && (
        <TransferForm
          onClose={() => setTransferEditing(null)}
          existing={transferEditing === 'new' ? undefined : transferEditing}
        />
      )}
    </div>
  );
}
