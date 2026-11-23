import { BookOpen } from 'lucide-react';
import styles from './Splash.module.css';

export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <span className={styles.mark} style={{ width: size, height: size, borderRadius: size * 0.32 }}>
      <BookOpen size={size * 0.5} strokeWidth={2} />
    </span>
  );
}

export default function Splash({ message = 'Cargando…' }: { message?: string }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.logo}>
        <BrandMark size={64} />
        <span className={styles.ring} aria-hidden="true" />
      </div>
      <div className={styles.title}>Libro de Gastos</div>
      <div className={styles.message}>{message}</div>
      <div className={styles.bar} aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
