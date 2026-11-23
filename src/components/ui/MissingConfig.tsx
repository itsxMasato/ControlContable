import { KeyRound } from 'lucide-react';
import styles from './MissingConfig.module.css';

export default function MissingConfig({ missing }: { missing: string[] }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <span className={styles.icon}>
          <KeyRound size={26} strokeWidth={2} />
        </span>
        <h1 className={styles.title}>Faltan las claves de Firebase</h1>
        <p className={styles.text}>
          La app no puede conectarse a tu cuenta porque estas variables no están configuradas en este build:
        </p>
        <ul className={styles.list}>
          {missing.map((k) => (
            <li key={k}>
              <code>{k}</code>
            </li>
          ))}
        </ul>
        <ol className={styles.steps}>
          <li>
            En local: copiá <code>.env.local.example</code> a <code>.env.local</code> y completá las claves (Firebase
            Console → Project settings → Your apps).
          </li>
          <li>
            En Netlify: agregalas en <strong>Site settings → Environment variables</strong>.
          </li>
          <li>
            Reiniciá <code>npm run dev</code> o volvé a correr <code>npm run build</code> (las claves se incluyen al
            compilar).
          </li>
        </ol>
      </div>
    </div>
  );
}
