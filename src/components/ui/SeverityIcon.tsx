import { AlertTriangle, Info, PartyPopper } from 'lucide-react';
import type { AlertSeverity } from '../../types';

const CONFIG: Record<AlertSeverity, { Icon: typeof Info; bg: string; fg: string }> = {
  info: { Icon: Info, bg: 'var(--slate-soft)', fg: 'var(--slate)' },
  advertencia: { Icon: AlertTriangle, bg: 'var(--brick-soft)', fg: 'var(--brick)' },
  logro: { Icon: PartyPopper, bg: 'var(--forest-soft)', fg: 'var(--forest)' },
};

export default function SeverityIcon({ severity, size = 18 }: { severity: AlertSeverity; size?: number }) {
  const { Icon, bg, fg } = CONFIG[severity];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size + 16,
        height: size + 16,
        borderRadius: '999px',
        background: bg,
        color: fg,
        flexShrink: 0,
      }}
    >
      <Icon size={size} strokeWidth={2} />
    </span>
  );
}
