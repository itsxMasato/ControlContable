import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './MetricCard.module.css';

export default function MetricCard({
  label,
  value,
  delta,
  deltaGoodDirection = 'down',
  icon,
}: {
  label: string;
  value: string;
  delta?: { pct: number; caption: string } | null;
  deltaGoodDirection?: 'up' | 'down';
  icon?: ReactNode;
}) {
  const isUp = (delta?.pct ?? 0) >= 0;
  const isGood = delta ? (deltaGoodDirection === 'down' ? !isUp : isUp) : true;

  return (
    <div className="card card--hover">
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className={styles.label}>{label}</span>
          {icon}
        </div>
        <span className={styles.value}>{value}</span>
        {delta && (
          <span className={styles.delta} style={{ color: isGood ? 'var(--forest)' : 'var(--brick)' }}>
            {isUp ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
            {Math.abs(delta.pct).toFixed(1)}% {delta.caption}
          </span>
        )}
      </div>
    </div>
  );
}
