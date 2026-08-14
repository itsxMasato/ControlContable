import { useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import formStyles from '../ui/Form.module.css';
import { useAppData } from '../../context/AppDataContext';
import type { Transaction, TransactionType } from '../../types';
import { todayISO } from '../../utils/dates';

export default function TransactionForm({
  onClose,
  existing,
  defaultBankId,
}: {
  onClose: () => void;
  existing?: Transaction;
  defaultBankId?: string | null;
}) {
  const { data, addTransaction, updateTransaction, deleteTransaction } = useAppData();
  const topCategories = useMemo(() => data.categories.filter((c) => c.parentId === null), [data.categories]);

  const existingTop = existing
    ? data.categories.find((c) => c.id === existing.categoryId)?.parentId
      ? data.categories.find((c) => c.id === existing.categoryId)!.parentId
      : existing.categoryId
    : null;

  const [tipo, setTipo] = useState<TransactionType>(existing?.tipo ?? 'gasto');
  const [monto, setMonto] = useState(existing ? String(existing.monto) : '');
  const [fecha, setFecha] = useState(existing?.fecha ?? todayISO());
  const [bankId, setBankId] = useState(existing?.bankId ?? defaultBankId ?? data.banks[0]?.id ?? '');
  const [topCategoryId, setTopCategoryId] = useState(existingTop ?? topCategories[0]?.id ?? '');
  const [subCategoryId, setSubCategoryId] = useState(
    existing && data.categories.find((c) => c.id === existing.categoryId)?.parentId ? existing.categoryId : ''
  );
  const [nota, setNota] = useState(existing?.nota ?? '');
  const [error, setError] = useState('');

  const subcategories = data.categories.filter((c) => c.parentId === topCategoryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum <= 0) {
      setError('Ingresá un monto válido mayor a cero.');
      return;
    }
    if (!bankId) {
      setError('Seleccioná un banco o cuenta.');
      return;
    }
    const categoryId = subCategoryId || topCategoryId;
    if (!categoryId) {
      setError('Seleccioná una categoría.');
      return;
    }

    const tx: Transaction = {
      id: existing?.id ?? crypto.randomUUID(),
      fecha,
      bankId,
      categoryId,
      monto: montoNum,
      tipo,
      nota,
    };
    if (existing) updateTransaction(tx);
    else addTransaction(tx);
    onClose();
  };

  return (
    <Modal title={existing ? 'Editar transacción' : 'Nueva transacción'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className={formStyles.toggleRow} style={{ marginBottom: 16 }}>
          <button
            type="button"
            className={`${formStyles.toggleBtn} ${tipo === 'gasto' ? formStyles.toggleBtnActiveExpense : ''}`}
            onClick={() => setTipo('gasto')}
          >
            Gasto
          </button>
          <button
            type="button"
            className={`${formStyles.toggleBtn} ${tipo === 'ingreso' ? formStyles.toggleBtnActiveIncome : ''}`}
            onClick={() => setTipo('ingreso')}
          >
            Ingreso
          </button>
        </div>

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
          <label className={formStyles.label}>Banco / cuenta</label>
          <select className={formStyles.select} value={bankId} onChange={(e) => setBankId(e.target.value)}>
            {data.banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Categoría</label>
            <select
              className={formStyles.select}
              value={topCategoryId}
              onChange={(e) => {
                setTopCategoryId(e.target.value);
                setSubCategoryId('');
              }}
            >
              {topCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Subcategoría</label>
            <select
              className={formStyles.select}
              value={subCategoryId}
              onChange={(e) => setSubCategoryId(e.target.value)}
              disabled={subcategories.length === 0}
            >
              <option value="">General</option>
              {subcategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label}>Nota</label>
          <input
            className={formStyles.input}
            type="text"
            placeholder="Ej. Supermercado semanal"
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
            {existing ? 'Guardar cambios' : 'Registrar movimiento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
