import { NavLink } from 'react-router-dom';
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  Settings,
  Sparkles,
  Tags,
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { useAuth } from '../../context/AuthContext';
import { BrandMark } from '../ui/Splash';
import SyncStatus from '../ui/SyncStatus';

const NAV_GROUPS = [
  {
    label: 'General',
    items: [
      { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true },
      { to: '/transacciones', label: 'Transacciones', icon: ArrowLeftRight, end: false },
      { to: '/bancos', label: 'Bancos y cuentas', icon: Landmark, end: false },
      { to: '/categorias', label: 'Categorías', icon: Tags, end: false },
      { to: '/ahorros', label: 'Ahorros y metas', icon: PiggyBank, end: false },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { to: '/reportes', label: 'Reportes', icon: BarChart3, end: false },
      { to: '/alertas', label: 'Alertas', icon: Bell, end: false },
      { to: '/asistente', label: 'Asistente IA', icon: Sparkles, end: false },
    ],
  },
  {
    label: 'Cuenta',
    items: [{ to: '/configuracion', label: 'Configuración', icon: Settings, end: false }],
  },
];

export default function Sidebar() {
  const { user } = useAuth();
  const initial = (user?.email ?? '?').charAt(0).toUpperCase();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <BrandMark size={38} />
        <div className={styles.brandCopy}>
          <div className={styles.brandText}>Libro de Gastos</div>
          <div className={styles.brandSub}>Control financiero</div>
        </div>
      </div>
      <nav className={styles.nav}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className={styles.group} data-tour={group.label === 'Análisis' ? 'analysis' : undefined}>
            <div className={styles.groupLabel}>{group.label}</div>
            {group.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={label}
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                <span className={styles.navIcon}>
                  <Icon size={18} strokeWidth={1.9} />
                </span>
                <span className={styles.navLabel}>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className={styles.footer}>
        <div className={styles.user}>
          <span className={styles.avatar}>{initial}</span>
          <span className={styles.email} title={user?.email ?? ''}>
            {user?.email}
          </span>
        </div>
        <span data-tour="sync">
          <SyncStatus />
        </span>
      </div>
    </aside>
  );
}
