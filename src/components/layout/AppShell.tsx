import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';
import styles from './AppShell.module.css';
import Toaster from '../ui/Toaster';
import GuidedTour from '../tour/GuidedTour';

export default function AppShell() {
  return (
    <div>
      <Sidebar />
      <div className={styles.main}>
        <Topbar />
        <Outlet />
      </div>
      <MobileNav />
      <Toaster />
      <GuidedTour />
    </div>
  );
}
