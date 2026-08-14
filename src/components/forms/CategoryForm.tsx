import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import formStyles from '../ui/Form.module.css';
import { useAppData } from '../../context/AppDataContext';
import { useTheme } from '../../context/ThemeContext';
import { getChartPalette } from '../../utils/chartPalette';
import type { Category } from '../../types';

export default function CategoryForm({
  onClose,
  existing,
  defaultParentId,
}: {
  onClose: () => void;
  existing?: Category;
  defaultParentId?: string | null;
}) {
  const { data, addCategory, updateCategory, deleteCategory } = useAppData();
  const { accent, dark } = useTheme();
  const COLORS = getChartPalette(accent, dark);
  const topCategories = data.categories.filter((c) => c.parentId === null && c.id !== existing?.id);

  const [nombre, setNombre] = useState(existing?.nombre ?? '');
  const [parentId, setParentId] = useState<string>(existing?.parentId ?? defaultParentId ?? '');
  const [presupuesto, setPresupuesto] = useState(existing?.presupuestoMensual ? String(existing.presupuestoMensual) : '');
  const [colorIndex, setColorIndex] = useState(existing?.colorIndex ?? 0);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('Ingresá un nombre para la categoría.');
      return;
    }
    const category: Category = {
      id: existing?.id ?? crypto.randomUUID(),
      nombre: nombre.trim(),
      parentId: parentId || null,
      presupuestoMensual: presupuesto ? parseFloat(presupuesto) : null,
      colorIndex,
      icono: existing?.icono ?? 'ellipsis',
    };
    if (existing) updateCategory(category);
    else addCategory(category);
    onClose();
  };

  return (
    <Modal title={existing ? 'Editar categoría' : 'Nueva categoría'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className={formStyles.field}>
          <label className={formStyles.label}>Nombre</label>
          <input
            className={formStyles.input}
            type="text"
            placeholder="Ej. Mascotas"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label}>Categoría padre (opcional)</label>
          <select className={formStyles.select} value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Ninguna — es categoría principal</option>
            {topCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Presupuesto mensual (opcional)</label>
            <input
              className={`${formStyles.input} ${formStyles.amountInput}`}
              type="number"
              step="0.01"
              placeholder="Sin límite"
              value={presupuesto}
              onChange={(e) => setPresupuesto(e.target.value)}
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Color</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 4 }}>
              {COLORS.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColorIndex(i)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: c,
                    border: colorIndex === i ? '2px solid var(--ink)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        {error && <div className={formStyles.error}>{error}</div>}

        <div className={formStyles.actions}>
          {existing && (
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                deleteCategory(existing.id);
                onClose();
              }}
            >
              Eliminar
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {existing ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
