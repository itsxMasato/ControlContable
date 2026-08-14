import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import Login from '../../pages/Login/Login';

function FullScreenMessage({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--paper)',
        color: 'var(--ink-soft)',
        fontFamily: 'var(--font-serif)',
        fontSize: 16,
      }}
    >
      {children}
    </div>
  );
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const { authReady, user } = useAuth();

  if (!authReady) return <FullScreenMessage>Cargando…</FullScreenMessage>;
  if (!user) return <Login />;
  return <>{children}</>;
}
