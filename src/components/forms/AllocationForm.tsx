import { useMemo, useState } from 'react';
import { Link2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import formStyles from '../ui/Form.module.css';
import { useAppData } from '../../context/AppDataContext';
import type { Allocation, Bank } from '../../types';
import { monthKey, todayISO } from '../../utils/dates';
import { bankAvailable } from '../../utils/calculations';
import { formatMoney } from '../../utils/currency';
import { roundMoney } from '../../utils/accounts';
import { getIcon } from '../ui/iconMap';

export default function AllocationForm({
  onClose,
  bank,
  existing,
}: {
  onClose: () => void;
  bank: Bank;
  existing?: Allocation;
}) {
  const { data, addAllocation, updateAllocation, deleteAllocation, payAllocation } = useAppData();
  const currency = data.settings.moneda;
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '');
  const [nombre, setNombre] = useState(existing?.nombre ?? '');
  const [nombreTocado, setNombreTocado] = useState(Boolean(existing));
  const [monto, setMonto] = useState(existing ? String(existing.monto) : '');
  const [nota, setNota] = useState(existing?.nota ?? '');
  const [recurrente, setRecurrente] = useState(existing?.recurrente ?? false);
  const [error, setError] = useState('');

  // Categorías ordenadas: cada principal seguida de sus subcategorías
  const categoryOptions = useMemo(() => {
    const tops = data.categories
      .filter((c) => c.parentId === null)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
    return tops.flatMap((top) => [
      { id: top.id, label: top.nombre },
      ...data.categories
        .filter((c) => c.parentId === top.id)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .map((c) => ({ id: c.id, label: `${top.nombre} › ${c.nombre}` })),
    ]);
  }, [data.categories]);

  const selectedCategory = data.categories.find((c) => c.id === categoryId);
  const CategoryIcon = selectedCategory ? getIcon(selectedCategory.icono) : null;

  // Lo que se puede apartar: disponible actual + lo que este apartado ya tenía reservado
  const disponible = roundMoney(bankAvailable(bank, data.transactions, data.allocations) + (existing?.monto ?? 0));
  const montoNum = parseFloat(monto) || 0;
  // Reducir o mantener un apartado siempre se permite; solo se bloquea apartar más de lo que hay
  const excede = montoNum > Math.max(disponible, existing?.monto ?? 0) + 0.009;

  const onCategoryChange = (id: string) => {
    setCategoryId(id);
    const cat = data.categories.find((c) => c.id === id);
    if (cat && !nombreTocado) setNombre(cat.nombre);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !montoNum || montoNum <= 0) {
      setError('Completá el nombre y un monto válido mayor a cero.');
      return;
    }
    if (excede) {
      setError(
        `No podés apartar más de lo disponible en ${bank.nombre} (${formatMoney(Math.max(disponible, 0), currency)}).`
      );
      return;
    }
    const allocation: Allocation = {
      id: existing?.id ?? crypto.randomUUID(),
      bankId: bank.id,
      nombre: nombre.trim(),
      monto: roundMoney(montoNum),
      nota: nota.trim(),
      recurringPaymentId: existing?.recurringPaymentId ?? null,
      cicloClave: existing?.cicloClave ?? monthKey(todayISO()),
      recurrente,
      montoObjetivo: recurrente ? roundMoney(montoNum) : null,
      categoryId: categoryId || null,
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
          <label className={formStyles.label}>¿Para qué categoría es este dinero?</label>
          <select className={formStyles.select} value={categoryId} onChange={(e) => onCategoryChange(e.target.value)}>
            <option value="">Sin categoría (apartado libre)</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          {selectedCategory && CategoryIcon ? (
            <p className="text-faint" style={{ fontSize: 12.5, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <Link2 size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                Los gastos en <strong>{selectedCategory.nombre}</strong> (y sus subcategorías) pagados desde {bank.nombre}{' '}
                se descuentan solos de este apartado. Al pagarlo, el gasto queda registrado en esa categoría.
              </span>
            </p>
          ) : (
            <p className="text-faint" style={{ fontSize: 12.5 }}>
              Vincularlo a una categoría hace que tus gastos lo vayan consumiendo automáticamente.
            </p>
          )}
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label}>Nombre</label>
          <input
            className={formStyles.input}
            type="text"
            placeholder="Ej. Pago de tarjeta, Renta, Viaje..."
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setNombreTocado(true);
            }}
          />
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Monto a apartar</span>
            <span className="mono" style={{ color: disponible > 0 ? 'var(--forest)' : 'var(--brick)' }}>
              Disponible: {formatMoney(Math.max(disponible, 0), currency)}
            </span>
          </label>
          <input
            className={`${formStyles.input} ${formStyles.amountInput}`}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            style={excede ? { borderColor: 'var(--brick)' } : undefined}
          />
          {disponible > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[0.1, 0.25, 0.5, 1].map((f) => (
                <button
                  key={f}
                  type="button"
                  className="badge"
                  style={{ border: '1px solid var(--border-strong)', background: 'var(--paper)', cursor: 'pointer', color: 'var(--ink-soft)' }}
                  onClick={() => setMonto(String(roundMoney(disponible * f)))}
                >
                  {f === 1 ? 'Todo' : `${f * 100}%`}
                </button>
              ))}
            </div>
          )}
          {excede && (
            <p style={{ fontSize: 12.5, color: 'var(--brick)' }}>
              Supera lo disponible en esta cuenta. Apartar dinero que no tenés descuadra tu saldo.
            </p>
          )}
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
              style={{ width: 18, height: 18, accentColor: 'var(--gold)' }}
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
              confirmText="Liberar el dinero apartado"
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
              confirmText={`Registrar gasto de ${formatMoney(existing.monto, currency)}`}
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
          <Button type="submit" variant="primary" disabled={excede}>
            {existing ? 'Guardar cambios' : 'Apartar monto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
