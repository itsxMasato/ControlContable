import { NavLink } from 'react-router-dom';
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpen,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  Settings,
  Sparkles,
  Tags,
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { useTheme } from '../../context/ThemeContext';

const NAV_ITEMS = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/transacciones', label: 'Transacciones', icon: ArrowLeftRight, end: false },
  { to: '/bancos', label: 'Bancos/Cuentas', icon: Landmark, end: false },
  { to: '/categorias', label: 'Categorías', icon: Tags, end: false },
  { to: '/ahorros', label: 'Ahorros y metas', icon: PiggyBank, end: false },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, end: false },
  { to: '/alertas', label: 'Alertas', icon: Bell, end: false },
  { to: '/asistente', label: 'Asistente IA', icon: Sparkles, end: false },
  { to: '/configuracion', label: 'Configuración', icon: Settings, end: false },
];

export default function Sidebar() {
  const { dark } = useTheme();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <BookOpen size={26} className={styles.brandMark} strokeWidth={1.6} />
        <div>
          <div className={styles.brandText}>Libro de Gastos</div>
          <div className={styles.brandSub}>Control financiero</div>
        </div>
      </div>
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span className={styles.navLabel}>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className={styles.footer}>
        <div className="text-faint" style={{ fontSize: 12 }}>
          {dark ? 'Modo oscuro' : 'Modo claro'} · datos locales
        </div>
      </div>
    </aside>
  );
}
