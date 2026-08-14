import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';
import styles from './AppShell.module.css';

export default function AppShell() {
  return (
    <div>
      <Sidebar />
      <div className={styles.main}>
        <Topbar />
        <Outlet />
      </div>
      <MobileNav />
    </div>
  );
}
