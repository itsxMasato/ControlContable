import type { ReactNode } from 'react';

type BadgeTone = 'gold' | 'brick' | 'forest' | 'slate' | 'neutral';

const TONE_VARS: Record<BadgeTone, { bg: string; fg: string }> = {
  gold: { bg: 'var(--gold-soft)', fg: 'var(--gold)' },
  brick: { bg: 'var(--brick-soft)', fg: 'var(--brick)' },
  forest: { bg: 'var(--forest-soft)', fg: 'var(--forest)' },
  slate: { bg: 'var(--slate-soft)', fg: 'var(--slate)' },
  neutral: { bg: 'var(--border)', fg: 'var(--ink-soft)' },
};

export default function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  const { bg, fg } = TONE_VARS[tone];
  return (
    <span className="badge" style={{ background: bg, color: fg }}>
      {children}
    </span>
  );
}
