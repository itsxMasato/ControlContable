import { Check, Pipette } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  CUSTOM_BASE,
  EXTRA_BASE,
  EXTRA_COLORS,
  decodeCustomColor,
  encodeCustomColor,
  getChartPalette,
} from '../../utils/chartPalette';
import styles from './ColorPicker.module.css';

/**
 * Selector de color para cuentas, categorías y metas.
 * - "Del tema": 8 tonos que se adaptan al color de la app (y quedan validados en los gráficos).
 * - "Más colores": 18 tonos fijos con variante clara/oscura.
 * - Personalizado: cualquier color con el selector del sistema.
 */
export default function ColorPicker({ value, onChange }: { value: number; onChange: (colorIndex: number) => void }) {
  const { accent, dark } = useTheme();
  const themeColors = getChartPalette(accent, dark);
  const isCustom = value >= CUSTOM_BASE;
  const customHex = isCustom ? decodeCustomColor(value) : '#7c3aed';

  const swatch = (color: string, index: number, label: string) => {
    const selected = value === index;
    return (
      <button
        key={index}
        type="button"
        className={`${styles.swatch} ${selected ? styles.selected : ''}`}
        style={{ background: color }}
        onClick={() => onChange(index)}
        aria-label={label}
        aria-pressed={selected}
        title={label}
      >
        {selected && <Check size={14} strokeWidth={3} />}
      </button>
    );
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.groupLabel}>Del tema</div>
      <div className={styles.row}>{themeColors.map((c, i) => swatch(c, i, `Color del tema ${i + 1}`))}</div>
      <div className={styles.groupLabel}>Más colores</div>
      <div className={styles.row}>
        {EXTRA_COLORS.map((c, i) => swatch(dark ? c.dark : c.light, EXTRA_BASE + i, c.name))}
        <label
          className={`${styles.swatch} ${styles.custom} ${isCustom ? styles.selected : ''}`}
          style={isCustom ? { background: customHex } : undefined}
          title="Color personalizado"
        >
          {isCustom ? <Check size={14} strokeWidth={3} /> : <Pipette size={14} />}
          <input
            type="color"
            value={customHex}
            onChange={(e) => onChange(encodeCustomColor(e.target.value))}
            aria-label="Elegir un color personalizado"
          />
        </label>
      </div>
    </div>
  );
}
