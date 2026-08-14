# Libro de Gastos

App de finanzas personales — control de gastos por banco/cuenta, categorías con subcategorías, metas de ahorro, alertas y un asistente de IA opcional (OpenAI, Claude o Gemini, con tu propia clave). React + Vite + TypeScript, con Firebase (Auth + Firestore) como backend.

## Uso local

```bash
npm install
npm run dev
```

Abrí http://localhost:5173, creá una cuenta (email + contraseña) y empezá a cargar tus datos — no trae datos de ejemplo, arranca vacío.

```bash
npm run build   # build de producción en dist/
```

## Configuración de Firebase

1. Copiá `.env.local.example` a `.env.local` y completá las claves de tu proyecto de Firebase (Project settings → General → Your apps).
2. En Firebase Console → **Authentication → Sign-in method**, habilitá el proveedor **Correo electrónico/contraseña**.
3. En Firebase Console → **Firestore Database → Reglas**, pegá el contenido de `firestore.rules` de este repo y publicá.

## Deploy en Netlify

El repo ya trae `netlify.toml` (build command, carpeta `dist`, redirect SPA para las rutas de React Router, versión de Node). Pasos:

1. En Netlify, "Add new site" → "Import an existing project" → conectá este repo de GitHub.
2. En **Site settings → Environment variables**, agregá las mismas seis claves de `.env.local`:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
3. En Firebase Console → **Authentication → Settings → Authorized domains**, agregá el dominio que te da Netlify (ej. `tu-sitio.netlify.app`) — si no lo agregás, el login falla en producción aunque funcione en local.
4. Deploy. Netlify va a correr `npm run build` y publicar `dist/`.
