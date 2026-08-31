import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import formStyles from '../ui/Form.module.css';
import { useAppData } from '../../context/AppDataContext';
import type { Allocation, Bank } from '../../types';
import { monthKey, todayISO } from '../../utils/dates';

export default function AllocationForm({
  onClose,
  bank,
  existing,
}: {
  onClose: () => void;
  bank: Bank;
  existing?: Allocation;
}) {
  const { addAllocation, updateAllocation, deleteAllocation, payAllocation } = useAppData();
  const [nombre, setNombre] = useState(existing?.nombre ?? '');
  const [monto, setMonto] = useState(existing ? String(existing.monto) : '');
  const [nota, setNota] = useState(existing?.nota ?? '');
  const [recurrente, setRecurrente] = useState(existing?.recurrente ?? false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (!nombre.trim() || !montoNum || montoNum <= 0) {
      setError('Completá el nombre y un monto válido mayor a cero.');
      return;
    }
    const allocation: Allocation = {
      id: existing?.id ?? crypto.randomUUID(),
      bankId: bank.id,
      nombre: nombre.trim(),
      monto: montoNum,
      nota: nota.trim(),
      recurringPaymentId: existing?.recurringPaymentId ?? null,
      cicloClave: existing?.cicloClave ?? monthKey(todayISO()),
      recurrente,
      montoObjetivo: recurrente ? montoNum : null,
    };
    if (existing) updateAllocation(allocation);
    else addAllocation(allocation);
    onClose();
  };

  return (
    <Modal title={existing ? 'Editar apartado' : `Nuevo apartado en ${bank.nombre}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {existing?.recurringPaymentId && (
          <p style={{ fontSize: 12.5, marginBottom: 12, color: 'var(--ink-soft)' }}>
            Este apartado lo generó el sistema automáticamente para un pago recurrente. Si lo editás, pasa a ser manual.
          </p>
        )}
        <div className={formStyles.field}>
          <label className={formStyles.label}>Nombre</label>
          <input
            className={formStyles.input}
            type="text"
            placeholder="Ej. Pago de tarjeta, Renta, Viaje..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label}>Monto apartado</label>
          <input
            className={`${formStyles.input} ${formStyles.amountInput}`}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label}>Nota (opcional)</label>
          <input
            className={formStyles.input}
            type="text"
            placeholder="Detalle adicional"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={recurrente}
              onChange={(e) => setRecurrente(e.target.checked)}
              style={{ width: 15, height: 15 }}
            />
            Repetir cada mes automáticamente
          </label>
          {recurrente && (
            <p className="text-faint" style={{ fontSize: 12.5, marginTop: 6 }}>
              Al pagarlo, este apartado se vuelve a apartar solo al llegar el mes siguiente.
            </p>
          )}
        </div>
        {error && <div className={formStyles.error}>{error}</div>}
        <div className={formStyles.actions}>
          {existing && (
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                deleteAllocation(existing.id);
                onClose();
              }}
            >
              Eliminar
            </Button>
          )}
          {existing && !existing.recurringPaymentId && existing.monto > 0 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                payAllocation(existing);
                onClose();
              }}
            >
              Pagar
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {existing ? 'Guardar cambios' : 'Apartar monto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
