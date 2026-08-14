import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

function LedgerIllustration() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none" className={styles.icon}>
      <rect x="14" y="16" width="68" height="64" rx="4" stroke="currentColor" strokeWidth="2" />
      <line x1="48" y1="16" x2="48" y2="80" stroke="currentColor" strokeWidth="2" />
      <line x1="22" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="22" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="22" y1="50" x2="36" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="56" y1="30" x2="74" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="56" y1="40" x2="74" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="56" y1="50" x2="68" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <circle cx="48" cy="80" r="14" fill="var(--card)" stroke="currentColor" strokeWidth="2" />
      <line x1="48" y1="73" x2="48" y2="87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="41" y1="80" x2="55" y2="80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.wrap}>
      <LedgerIllustration />
      <div className={styles.title}>{title}</div>
      <div className={styles.subtitle}>{subtitle}</div>
      {action}
    </div>
  );
}
