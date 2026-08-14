import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import formStyles from '../ui/Form.module.css';
import { useAppData } from '../../context/AppDataContext';
import { useTheme } from '../../context/ThemeContext';
import { getChartPalette } from '../../utils/chartPalette';
import type { SavingsGoal } from '../../types';

const ICONS = [
  { value: 'shield', label: 'Escudo' },
  { value: 'plane', label: 'Avión' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'home', label: 'Casa' },
  { value: 'piggy-bank', label: 'Alcancía' },
];

export default function GoalForm({ onClose, existing }: { onClose: () => void; existing?: SavingsGoal }) {
  const { addGoal, updateGoal, deleteGoal } = useAppData();
  const { accent, dark } = useTheme();
  const COLORS = getChartPalette(accent, dark);
  const [nombre, setNombre] = useState(existing?.nombre ?? '');
  const [montoObjetivo, setMontoObjetivo] = useState(existing ? String(existing.montoObjetivo) : '');
  const [fechaObjetivo, setFechaObjetivo] = useState(existing?.fechaObjetivo ?? '');
  const [colorIndex, setColorIndex] = useState(existing?.colorIndex ?? 0);
  const [icono, setIcono] = useState(existing?.icono ?? ICONS[0].value);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(montoObjetivo);
    if (!nombre.trim() || !monto || monto <= 0) {
      setError('Completá el nombre y un monto objetivo válido.');
      return;
    }
    const goal: SavingsGoal = {
      id: existing?.id ?? crypto.randomUUID(),
      nombre: nombre.trim(),
      montoObjetivo: monto,
      fechaObjetivo: fechaObjetivo || null,
      colorIndex,
      icono,
      contributions: existing?.contributions ?? [],
    };
    if (existing) updateGoal(goal);
    else addGoal(goal);
    onClose();
  };

  return (
    <Modal title={existing ? 'Editar meta' : 'Nueva meta de ahorro'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className={formStyles.field}>
          <label className={formStyles.label}>Nombre</label>
          <input
            className={formStyles.input}
            type="text"
            placeholder="Ej. Fondo de emergencia"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />
        </div>

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Monto objetivo</label>
            <input
              className={`${formStyles.input} ${formStyles.amountInput}`}
              type="number"
              step="0.01"
              placeholder="0.00"
              value={montoObjetivo}
              onChange={(e) => setMontoObjetivo(e.target.value)}
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Fecha objetivo (opcional)</label>
            <input
              className={formStyles.input}
              type="date"
              value={fechaObjetivo}
              onChange={(e) => setFechaObjetivo(e.target.value)}
            />
          </div>
        </div>

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Ícono</label>
            <select className={formStyles.select} value={icono} onChange={(e) => setIcono(e.target.value)}>
              {ICONS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Color</label>
            <div style={{ display: 'flex', gap: 6, paddingTop: 4, flexWrap: 'wrap' }}>
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
                deleteGoal(existing.id);
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
            {existing ? 'Guardar cambios' : 'Crear meta'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
