import { Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard/Dashboard';
import Transactions from './pages/Transactions/Transactions';
import Banks from './pages/Banks/Banks';
import Categories from './pages/Categories/Categories';
import Savings from './pages/Savings/Savings';
import Reports from './pages/Reports/Reports';
import Alerts from './pages/Alerts/Alerts';
import Settings from './pages/Settings/Settings';
import Assistant from './pages/Assistant/Assistant';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transacciones" element={<Transactions />} />
        <Route path="/bancos" element={<Banks />} />
        <Route path="/categorias" element={<Categories />} />
        <Route path="/ahorros" element={<Savings />} />
        <Route path="/reportes" element={<Reports />} />
        <Route path="/alertas" element={<Alerts />} />
        <Route path="/asistente" element={<Assistant />} />
        <Route path="/configuracion" element={<Settings />} />
      </Route>
    </Routes>
  );
}
