import type { ReactNode } from 'react';

export default function ChartTooltip({ active, children }: { active?: boolean; children: ReactNode }) {
  if (!active) return null;
  return (
    <div
      style={{
        background: 'var(--card-raised, var(--card))',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '10px 14px',
        fontSize: 12.5,
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {children}
    </div>
  );
}
