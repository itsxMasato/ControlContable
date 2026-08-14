import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import styles from './Transactions.module.css';
import { useAppData } from '../../context/AppDataContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import TransactionForm from '../../components/forms/TransactionForm';
import { formatDateShort } from '../../utils/dates';
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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transacciones</h1>
          <p className="page-subtitle">{filtered.length} movimiento{filtered.length === 1 ? '' : 's'}</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setEditing('new')}>
          Nueva transacción
        </Button>
      </div>

      <div className={styles.filters}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--ink-faint)' }} />
          <input
            className={styles.filterInput}
            style={{ paddingLeft: 30, minWidth: 200 }}
            type="text"
            placeholder="Buscar por nota, banco, categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
        <span className="text-faint" style={{ fontSize: 12 }}>
          a
        </span>
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
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setEditing(t)}
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
                      <td>{t.nota || '—'}</td>
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
      )}

      {editing && (
        <TransactionForm onClose={() => setEditing(null)} existing={editing === 'new' ? undefined : editing} />
      )}
    </div>
  );
}
