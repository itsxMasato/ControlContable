import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import styles from './Categories.module.css';
import { useAppData } from '../../context/AppDataContext';
import { useTheme } from '../../context/ThemeContext';
import { getIcon } from '../../components/ui/iconMap';
import ProgressBar from '../../components/ui/ProgressBar';
import Button from '../../components/ui/Button';
import CategoryForm from '../../components/forms/CategoryForm';
import { categorySpendByMonth, subcategoryIds } from '../../utils/calculations';
import { formatMoney } from '../../utils/currency';
import { resolveThemeColor } from '../../utils/chartPalette';
import { monthKey, todayISO } from '../../utils/dates';
import type { Category } from '../../types';

export default function Categories() {
  const { data } = useAppData();
  const { categories, transactions, settings } = data;
  const { accent, dark } = useTheme();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(categories.filter((c) => c.parentId === null).map((c) => c.id)));
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [newSubParent, setNewSubParent] = useState<string | null>(null);

  const currentMonth = monthKey(todayISO());
  const topCategories = categories.filter((c) => c.parentId === null);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categorías</h1>
          <p className="page-subtitle">Gasto acumulado del mes y presupuestos por categoría</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setEditing('new')}>
          Nueva categoría
        </Button>
      </div>

      {topCategories.length === 0 ? (
        <div className="card">
          <p className="text-soft">Todavía no hay categorías configuradas.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {topCategories.map((cat) => {
            const Icon = getIcon(cat.icono);
            const catColor = resolveThemeColor(cat.colorIndex, cat.id, accent, dark);
            const subs = categories.filter((c) => c.parentId === cat.id);
            const subIds = subcategoryIds(categories, cat.id);
            const spend = categorySpendByMonth(transactions, cat.id, currentMonth, subIds);
            const isOpen = expanded.has(cat.id);
            return (
              <div key={cat.id}>
                <div className={styles.row}>
                  <button
                    className={styles.chevronBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(cat.id);
                    }}
                    style={{ visibility: subs.length ? 'visible' : 'hidden' }}
                  >
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div className={styles.iconWrap} style={{ background: `${catColor}22`, color: catColor }}>
                    <Icon size={16} strokeWidth={1.8} />
                  </div>
                  <div className={styles.name} onClick={() => setEditing(cat)}>
                    {cat.nombre}
                  </div>
                  <div className={styles.progressWrap}>
                    {cat.presupuestoMensual ? (
                      <ProgressBar value={spend} max={cat.presupuestoMensual} color={catColor} />
                    ) : (
                      <span className="text-faint" style={{ fontSize: 12 }}>
                        Sin presupuesto asignado
                      </span>
                    )}
                  </div>
                  <div className={styles.amounts} onClick={() => setEditing(cat)}>
                    {formatMoney(spend, settings.moneda)}
                    {cat.presupuestoMensual && (
                      <span className="text-faint"> / {formatMoney(cat.presupuestoMensual, settings.moneda)}</span>
                    )}
                  </div>
                  <button
                    className={styles.addSubBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewSubParent(cat.id);
                    }}
                  >
                    + Sub
                  </button>
                </div>
                {isOpen &&
                  subs.map((sub) => {
                    const SubIcon = getIcon(sub.icono);
                    const subColor = resolveThemeColor(sub.colorIndex, sub.id, accent, dark);
                    const subSpend = categorySpendByMonth(transactions, sub.id, currentMonth);
                    return (
                      <div key={sub.id} className={`${styles.row} ${styles.subRow}`} onClick={() => setEditing(sub)}>
                        <span style={{ width: 20 }} />
                        <div className={styles.iconWrap} style={{ width: 28, height: 28, background: `${subColor}18`, color: subColor }}>
                          <SubIcon size={14} strokeWidth={1.8} />
                        </div>
                        <div className={styles.name} style={{ fontWeight: 500 }}>
                          {sub.nombre}
                        </div>
                        <div className={styles.progressWrap}>
                          {sub.presupuestoMensual ? (
                            <ProgressBar value={subSpend} max={sub.presupuestoMensual} color={subColor} />
                          ) : (
                            <span className="text-faint" style={{ fontSize: 12 }}>
                              —
                            </span>
                          )}
                        </div>
                        <div className={styles.amounts}>{formatMoney(subSpend, settings.moneda)}</div>
                        <span style={{ width: 40 }} />
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <CategoryForm onClose={() => setEditing(null)} existing={editing === 'new' ? undefined : editing} />
      )}
      {newSubParent && (
        <CategoryForm onClose={() => setNewSubParent(null)} defaultParentId={newSubParent} />
      )}
    </div>
  );
}
