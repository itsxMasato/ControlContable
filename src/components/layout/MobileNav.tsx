import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Grid2x2,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  Plus,
  Settings,
  Sparkles,
  Tags,
} from 'lucide-react';
import styles from './MobileNav.module.css';
import TransactionForm from '../forms/TransactionForm';
import { useActiveAccount } from '../../context/ActiveAccountContext';
import { useBackClose } from '../../hooks/useBackClose';
import { useSheetDrag } from '../../hooks/useSheetDrag';

const LEFT = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true },
  {
    to: '/transacciones',
    label: 'Movimientos',
    icon: ArrowLeftRight,
    end: false,
  },
];
const RIGHT = [{ to: '/ahorros', label: 'Ahorros', icon: PiggyBank, end: false }];

const MORE = [
  { to: '/bancos', label: 'Bancos', icon: Landmark },
  { to: '/categorias', label: 'Categorías', icon: Tags },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/alertas', label: 'Alertas', icon: Bell },
  { to: '/asistente', label: 'Asistente IA', icon: Sparkles },
  { to: '/configuracion', label: 'Ajustes', icon: Settings },
];

function MoreSheet({ onClose }: { onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, 200);
  }, [onClose]);
  useBackClose(close);
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useSheetDrag(sheetRef, onClose);

  return createPortal(
    <div
      className={`${styles.sheet} ${closing ? styles.sheetClosing : ''}`}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div ref={sheetRef} className={styles.sheetContent} role="dialog" aria-label="Más secciones">
        <div className={styles.grab} {...drag}>
          <div className={styles.handle} />
          <div className={styles.sheetTitle}>Más secciones</div>
        </div>
        <div className={styles.sheetGrid}>
          {MORE.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              replace
              className={({ isActive }) => `${styles.tile} ${isActive ? styles.tileActive : ''}`}
              onClick={onClose}
            >
              <span className={styles.tileIcon}>
                <Icon size={22} strokeWidth={1.9} />
              </span>
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { activeBankId } = useActiveAccount();
  const location = useLocation();
  const moreActive = MORE.some((m) => location.pathname.startsWith(m.to));
  // Posición de la píldora que se desliza bajo el ítem activo (el 2 es el botón +)
  const activeIndex =
    location.pathname === '/'
      ? 0
      : location.pathname.startsWith('/transacciones')
        ? 1
        : location.pathname.startsWith('/ahorros')
          ? 3
          : moreActive || moreOpen
            ? 4
            : -1;

  const item = ({ to, label, icon: Icon, end }: (typeof LEFT)[number]) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      onClick={() => navigator.vibrate?.(4)}
      className={({ isActive }) => `${styles.item} ${isActive ? styles.itemActive : ''}`}
    >
      <span className={styles.itemIcon}>
        <Icon size={21} strokeWidth={1.9} />
      </span>
      <span className={styles.itemLabel}>{label}</span>
    </NavLink>
  );

  return (
    <>
      <nav className={styles.nav} aria-label="Navegación principal">
        <span
          className={styles.indicator}
          style={
            {
              '--i': activeIndex,
              opacity: activeIndex < 0 ? 0 : 1,
            } as React.CSSProperties
          }
          aria-hidden="true"
        />
        {LEFT.map(item)}
        <div className={styles.fabSlot}>
          <button
            className={styles.fab}
            data-tour="new-tx"
            onClick={() => {
              navigator.vibrate?.(8);
              setShowForm(true);
            }}
            aria-label="Nueva transacción"
          >
            <Plus size={26} strokeWidth={2.4} />
          </button>
        </div>
        {RIGHT.map(item)}
        <button
          className={`${styles.item} ${moreActive || moreOpen ? styles.itemActive : ''}`}
          onClick={() => setMoreOpen(true)}
          data-tour="analysis"
          aria-label="Más secciones"
        >
          <span className={styles.itemIcon}>
            <Grid2x2 size={21} strokeWidth={1.9} />
          </span>
          <span className={styles.itemLabel}>Más</span>
        </button>
      </nav>

      {moreOpen && <MoreSheet onClose={() => setMoreOpen(false)} />}
      {showForm && <TransactionForm onClose={() => setShowForm(false)} defaultBankId={activeBankId} />}
    </>
  );
}
