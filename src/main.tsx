import { createRoot } from 'react-dom/client';
import './index.css';
import MissingConfig from './components/ui/MissingConfig';

// Pide al navegador que no borre el almacenamiento local (IndexedDB con la caché de Firestore y los
// cambios pendientes de subir) aunque el teléfono se quede sin espacio. En Android, una PWA instalada
// suele obtener este permiso automáticamente.
if (navigator.storage?.persist) {
  navigator.storage
    .persisted()
    .then((already) => {
      if (!already) void navigator.storage.persist();
    })
    .catch(() => {});
}

const REQUIRED_ENV = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;
const missing = REQUIRED_ENV.filter((k) => !import.meta.env[k]);

const root = createRoot(document.getElementById('root')!);

// Sin las claves de Firebase, getAuth() lanza "auth/invalid-api-key" y la app queda en blanco.
// En ese caso se muestra una pantalla que explica cómo configurarlas; si están, se carga la app.
if (missing.length > 0) {
  root.render(<MissingConfig missing={[...missing]} />);
} else {
  void import('./bootstrap').then(({ mountApp }) => mountApp(root));
}
