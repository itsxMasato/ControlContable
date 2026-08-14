import styles from './ProgressBar.module.css';

export default function ProgressBar({
  value,
  max,
  color = 'var(--gold)',
  overColor = 'var(--brick)',
}: {
  value: number;
  max: number;
  color?: string;
  overColor?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const over = pct > 100;
  return (
    <div className={styles.track}>
      <div
        className={styles.fill}
        style={{ width: `${Math.min(pct, 100)}%`, background: over ? overColor : color }}
      />
    </div>
  );
}
