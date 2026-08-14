import type { ReactNode } from 'react';

export default function ChartTooltip({ active, children }: { active?: boolean; children: ReactNode }) {
  if (!active) return null;
  return (
    <div
      style={{
        background: 'var(--card-raised, var(--card))',
        border: '1px solid var(--border-strong)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12.5,
        boxShadow: 'none',
      }}
    >
      {children}
    </div>
  );
}
