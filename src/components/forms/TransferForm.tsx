import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import formStyles from '../ui/Form.module.css';
import { useAppData } from '../../context/AppDataContext';
import type { Transaction } from '../../types';
import { todayISO } from '../../utils/dates';

export default function TransferForm({
  onClose,
  existing,
}: {
  onClose: () => void;
  /** Cualquiera de las dos patas (salida o entrada) de la transferencia a editar. */
  existing?: Transaction;
}) {
  const { data, addTransfer, updateTransfer, deleteTransaction } = useAppData();

  const legs = existing ? data.transactions.filter((t) => t.transferId === existing.transferId) : [];
  const salidaExistente = legs.find((t) => t.tipo === 'gasto');
  const entradaExistente = legs.find((t) => t.tipo === 'ingreso');

  const [monto, setMonto] = useState(existing ? String(existing.monto) : '');
  const [fecha, setFecha] = useState(existing?.fecha ?? todayISO());
  const [origenBankId, setOrigenBankId] = useState(salidaExistente?.bankId ?? data.banks[0]?.id ?? '');
  const [destinoBankId, setDestinoBankId] = useState(
    entradaExistente?.bankId ?? data.banks.find((b) => b.id !== data.banks[0]?.id)?.id ?? ''
  );
  const [nota, setNota] = useState(existing?.nota ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum <= 0) {
      setError('Ingresá un monto válido mayor a cero.');
      return;
    }
    if (!origenBankId || !destinoBankId) {
      setError('Seleccioná las dos cuentas.');
      return;
    }
    if (origenBankId === destinoBankId) {
      setError('La cuenta de origen y destino deben ser distintas.');
      return;
    }
    const input = { fecha, origenBankId, destinoBankId, monto: montoNum, nota: nota.trim() };
    if (existing?.transferId) updateTransfer(existing.transferId, input);
    else addTransfer(input);
    onClose();
  };

  return (
    <Modal title={existing ? 'Editar transferencia' : 'Transferir entre cuentas'} onClose={onClose}>
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

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Cuenta origen</label>
            <select className={formStyles.select} value={origenBankId} onChange={(e) => setOrigenBankId(e.target.value)}>
              {data.banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Cuenta destino</label>
            <select className={formStyles.select} value={destinoBankId} onChange={(e) => setDestinoBankId(e.target.value)}>
              {data.banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>
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
                deleteTransaction(existing.id);
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
            {existing ? 'Guardar cambios' : 'Transferir'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
