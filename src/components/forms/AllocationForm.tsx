import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import formStyles from '../ui/Form.module.css';
import { useAppData } from '../../context/AppDataContext';
import type { Allocation, Bank } from '../../types';

export default function AllocationForm({
  onClose,
  bank,
  existing,
}: {
  onClose: () => void;
  bank: Bank;
  existing?: Allocation;
}) {
  const { addAllocation, updateAllocation, deleteAllocation } = useAppData();
  const [nombre, setNombre] = useState(existing?.nombre ?? '');
  const [monto, setMonto] = useState(existing ? String(existing.monto) : '');
  const [nota, setNota] = useState(existing?.nota ?? '');
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
    };
    if (existing) updateAllocation(allocation);
    else addAllocation(allocation);
    onClose();
  };

  return (
    <Modal title={existing ? 'Editar apartado' : `Nuevo apartado en ${bank.nombre}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
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
