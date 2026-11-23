import { StrictMode } from 'react';
import type { Root } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppDataProvider } from './context/AppDataContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ActiveAccountProvider } from './context/ActiveAccountContext';
import AuthGate from './components/auth/AuthGate';
import CustomCursor from './components/ui/CustomCursor';

export function mountApp(root: Root) {
  root.render(
    <StrictMode>
      <CustomCursor />
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
    </StrictMode>,
  );
}
