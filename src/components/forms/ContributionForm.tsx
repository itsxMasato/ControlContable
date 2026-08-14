import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import formStyles from '../ui/Form.module.css';
import { useAppData } from '../../context/AppDataContext';
import type { Contribution, SavingsGoal } from '../../types';
import { todayISO } from '../../utils/dates';

export default function ContributionForm({
  onClose,
  goal,
  existing,
}: {
  onClose: () => void;
  goal: SavingsGoal;
  existing?: Contribution;
}) {
  const { data, contributeToGoal, updateContribution, deleteContribution } = useAppData();
  const topCategories = data.categories.filter((c) => c.parentId === null);
  const bank = data.banks.find((b) => b.id === goal.bankId);
  const existingTransaction = existing?.transactionId
    ? data.transactions.find((t) => t.id === existing.transactionId)
    : undefined;

  const [monto, setMonto] = useState(existing ? String(existing.monto) : '');
  const [fecha, setFecha] = useState(existing?.fecha ?? todayISO());
  const [categoryId, setCategoryId] = useState(existingTransaction?.categoryId ?? topCategories[0]?.id ?? '');
  const [nota, setNota] = useState(existing?.nota ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum <= 0) {
      setError('Ingresá un monto válido mayor a cero.');
      return;
    }
    if (!bank) {
      setError('La cuenta asociada a esta meta ya no existe. Editá la meta y elegí otra cuenta.');
      return;
    }
    if (!categoryId) {
      setError('Seleccioná una categoría para registrar el gasto.');
      return;
    }
    const input = { monto: montoNum, fecha, nota: nota.trim(), categoryId };
    if (existing) updateContribution(goal, existing, input);
    else contributeToGoal(goal, input);
    onClose();
  };

  return (
    <Modal title={existing ? `Editar aporte de "${goal.nombre}"` : `Aportar a "${goal.nombre}"`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p style={{ fontSize: 12.5, marginBottom: 12, color: 'var(--ink-soft)' }}>
          {bank
            ? `Se descontará de ${bank.nombre} y quedará registrado como movimiento.`
            : 'La cuenta asociada a esta meta ya no existe.'}
        </p>
        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Monto</label>
            <input
              className={`${formStyles.input} ${formStyles.amountInput}`}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              autoFocus
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Fecha</label>
            <input
              className={formStyles.input}
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label}>Categoría</label>
          <select className={formStyles.select} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {topCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label}>Nota (opcional)</label>
          <input
            className={formStyles.input}
            type="text"
            placeholder="Ej. Aguinaldo"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </div>
        {error && <div className={formStyles.error}>{error}</div>}
        <div className={formStyles.actions}>
          {existing && (
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                deleteContribution(goal, existing.id);
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
            {existing ? 'Guardar cambios' : 'Agregar aporte'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
