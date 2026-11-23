import { useState } from 'react';
import { ICON_GROUPS, getIcon } from './iconMap';
import styles from './IconPicker.module.css';

/**
 * Selector de íconos agrupado por tema. `preferredGroup` decide qué grupo se muestra primero
 * (ej. "Cuentas y finanzas" al crear un banco).
 */
export default function IconPicker({
  value,
  onChange,
  preferredGroup,
}: {
  value: string;
  onChange: (value: string) => void;
  preferredGroup?: string;
}) {
  const groups = preferredGroup
    ? [...ICON_GROUPS].sort((a, b) => (a.label === preferredGroup ? -1 : b.label === preferredGroup ? 1 : 0))
    : ICON_GROUPS;
  const initial = groups.find((g) => g.icons.some((i) => i.value === value))?.label ?? groups[0].label;
  const [tab, setTab] = useState(initial);
  const active = groups.find((g) => g.label === tab) ?? groups[0];
  const selectedLabel = ICON_GROUPS.flatMap((g) => g.icons).find((i) => i.value === value)?.label;

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs} role="tablist">
        {groups.map((g) => (
          <button
            key={g.label}
            type="button"
            role="tab"
            aria-selected={g.label === tab}
            className={`${styles.tab} ${g.label === tab ? styles.tabActive : ''}`}
            onClick={() => setTab(g.label)}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className={styles.grid} key={active.label}>
        {active.icons.map((opt) => {
          const Icon = getIcon(opt.value);
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              title={opt.label}
              aria-label={opt.label}
              aria-pressed={selected}
              className={`${styles.icon} ${selected ? styles.iconSelected : ''}`}
            >
              <Icon size={18} strokeWidth={1.9} />
            </button>
          );
        })}
      </div>
      {selectedLabel && <div className={styles.caption}>Seleccionado: {selectedLabel}</div>}
    </div>
  );
}
