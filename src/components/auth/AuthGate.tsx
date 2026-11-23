import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import Login from '../../pages/Login/Login';
import Splash from '../ui/Splash';

export default function AuthGate({ children }: { children: ReactNode }) {
  const { authReady, user } = useAuth();

  if (!authReady) return <Splash message="Preparando tu cuenta…" />;
  if (!user) return <Login />;
  return <>{children}</>;
}
