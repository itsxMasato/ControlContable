import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AppDataProvider } from './context/AppDataContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ActiveAccountProvider } from './context/ActiveAccountContext';
import AuthGate from './components/auth/AuthGate';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AuthGate>
        <AppDataProvider>
          <ThemeProvider>
            <ActiveAccountProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </ActiveAccountProvider>
          </ThemeProvider>
        </AppDataProvider>
      </AuthGate>
    </AuthProvider>
  </StrictMode>
);
