import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Search } from 'lucide-react';
import styles from './Topbar.module.css';
import { useAppData } from '../../context/AppDataContext';
import { useActiveAccount } from '../../context/ActiveAccountContext';
import { useAlerts } from '../../hooks/useAlerts';
import { formatMoney } from '../../utils/currency';
import { formatDateShort } from '../../utils/dates';
import Button from '../ui/Button';
import TransactionForm from '../forms/TransactionForm';

export default function Topbar() {
  const { data } = useAppData();
  const { activeBankId, setActiveBankId } = useActiveAccount();
  const alerts = useAlerts();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return data.transactions
      .filter((t) => {
        const cat = data.categories.find((c) => c.id === t.categoryId);
        const bank = data.banks.find((b) => b.id === t.bankId);
        return (
          t.nota.toLowerCase().includes(q) ||
          cat?.nombre.toLowerCase().includes(q) ||
          bank?.nombre.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [query, data]);

  const alertCount = alerts.filter((a) => a.severidad !== 'logro').length;

  return (
    <header className={styles.topbar}>
      <select
        className={styles.accountSelect}
        value={activeBankId ?? ''}
        onChange={(e) => setActiveBankId(e.target.value || null)}
      >
        <option value="">Todas las cuentas</option>
        {data.banks.map((b) => (
          <option key={b.id} value={b.id}>
            {b.nombre}
          </option>
        ))}
      </select>

      <div className={styles.searchWrap}>
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Buscar transacciones..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
        />
        {searchFocused && results.length > 0 && (
          <div className={styles.searchResults}>
            {results.map((t) => {
              const cat = data.categories.find((c) => c.id === t.categoryId);
              return (
                <div
                  key={t.id}
                  className={styles.searchResultItem}
                  onMouseDown={() => navigate(`/transacciones?buscar=${encodeURIComponent(t.nota || cat?.nombre || '')}`)}
                >
                  <span>
                    {t.nota || cat?.nombre} <span className="text-faint">· {formatDateShort(t.fecha)}</span>
                  </span>
                  <span className={`mono ${t.tipo === 'gasto' ? 'text-expense' : 'text-income'}`}>
                    {t.tipo === 'gasto' ? '-' : '+'}
                    {formatMoney(t.monto, data.settings.moneda)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.spacer} />

      <button className={styles.iconBtn} onClick={() => navigate('/alertas')} aria-label="Notificaciones">
        <Bell size={19} strokeWidth={1.8} />
        {alertCount > 0 && <span className={styles.badgeDot}>{alertCount}</span>}
      </button>

      <Button variant="primary" size="small" icon={<Plus size={16} />} onClick={() => setShowForm(true)}>
        Nueva transacción
      </Button>

      {showForm && <TransactionForm onClose={() => setShowForm(false)} defaultBankId={activeBankId} />}
    </header>
  );
}
