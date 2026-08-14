import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Ellipsis,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  Settings,
  Sparkles,
  Tags,
} from 'lucide-react';
import styles from './MobileNav.module.css';

const PRIMARY = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/transacciones', label: 'Movs.', icon: ArrowLeftRight, end: false },
  { to: '/bancos', label: 'Bancos', icon: Landmark, end: false },
  { to: '/ahorros', label: 'Ahorros', icon: PiggyBank, end: false },
];

const MORE = [
  { to: '/categorias', label: 'Categorías', icon: Tags },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/alertas', label: 'Alertas', icon: Bell },
  { to: '/asistente', label: 'Asistente IA', icon: Sparkles },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className={styles.nav}>
        {PRIMARY.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `${styles.item} ${isActive ? styles.itemActive : ''}`}>
            <Icon size={20} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
        <button className={styles.item} onClick={() => setOpen(true)}>
          <Ellipsis size={20} strokeWidth={1.8} />
          Más
        </button>
      </nav>

      {open && (
        <div className={styles.sheet} onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className={styles.sheetContent}>
            {MORE.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={styles.sheetItem} onClick={() => setOpen(false)}>
                <Icon size={18} strokeWidth={1.8} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
