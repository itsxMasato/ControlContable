import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import formStyles from '../ui/Form.module.css';
import { useAppData } from '../../context/AppDataContext';
import type { SavingsGoal } from '../../types';
import { todayISO } from '../../utils/dates';

export default function ContributionForm({ onClose, goal }: { onClose: () => void; goal: SavingsGoal }) {
  const { addContribution } = useAppData();
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(todayISO());
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum <= 0) {
      setError('Ingresá un monto válido mayor a cero.');
      return;
    }
    addContribution(goal.id, { id: crypto.randomUUID(), fecha, monto: montoNum, nota: nota.trim() });
    onClose();
  };

  return (
    <Modal title={`Aportar a "${goal.nombre}"`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
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
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Agregar aporte
          </Button>
        </div>
      </form>
    </Modal>
  );
}
