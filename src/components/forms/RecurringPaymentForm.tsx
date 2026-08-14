import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import formStyles from '../ui/Form.module.css';
import { useAppData } from '../../context/AppDataContext';
import type { RecurringPayment } from '../../types';

export default function RecurringPaymentForm({
  onClose,
  existing,
}: {
  onClose: () => void;
  existing?: RecurringPayment;
}) {
  const { data, addRecurring, updateRecurring, deleteRecurring } = useAppData();
  const topCategories = data.categories.filter((c) => c.parentId === null);

  const [nombre, setNombre] = useState(existing?.nombre ?? '');
  const [monto, setMonto] = useState(existing ? String(existing.monto) : '');
  const [bankId, setBankId] = useState(existing?.bankId ?? data.banks[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? topCategories[0]?.id ?? '');
  const [diaDeVencimiento, setDiaDeVencimiento] = useState(existing ? String(existing.diaDeVencimiento) : '1');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    const dia = parseInt(diaDeVencimiento, 10);
    if (!nombre.trim() || !montoNum || montoNum <= 0 || dia < 1 || dia > 28) {
      setError('Completá nombre, monto y un día de vencimiento entre 1 y 28.');
      return;
    }
    const rp: RecurringPayment = {
      id: existing?.id ?? crypto.randomUUID(),
      nombre: nombre.trim(),
      monto: montoNum,
      bankId,
      categoryId,
      diaDeVencimiento: dia,
    };
    if (existing) updateRecurring(rp);
    else addRecurring(rp);
    onClose();
  };

  return (
    <Modal title={existing ? 'Editar pago recurrente' : 'Nuevo pago recurrente'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className={formStyles.field}>
          <label className={formStyles.label}>Nombre</label>
          <input
            className={formStyles.input}
            type="text"
            placeholder="Ej. Renta departamento"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />
        </div>
        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Monto</label>
            <input
              className={`${formStyles.input} ${formStyles.amountInput}`}
              type="number"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Día de vencimiento</label>
            <input
              className={formStyles.input}
              type="number"
              min="1"
              max="28"
              value={diaDeVencimiento}
              onChange={(e) => setDiaDeVencimiento(e.target.value)}
            />
          </div>
        </div>
        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Banco</label>
            <select className={formStyles.select} value={bankId} onChange={(e) => setBankId(e.target.value)}>
              {data.banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
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
        </div>
        {error && <div className={formStyles.error}>{error}</div>}
        <div className={formStyles.actions}>
          {existing && (
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                deleteRecurring(existing.id);
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
            {existing ? 'Guardar cambios' : 'Agregar pago'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
