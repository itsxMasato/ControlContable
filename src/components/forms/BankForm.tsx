import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import formStyles from '../ui/Form.module.css';
import { useAppData } from '../../context/AppDataContext';
import { useTheme } from '../../context/ThemeContext';
import { getChartPalette } from '../../utils/chartPalette';
import type { AccountType, Bank } from '../../types';

const TIPOS: { value: AccountType; label: string }[] = [
  { value: 'corriente', label: 'Cuenta corriente' },
  { value: 'ahorro', label: 'Cuenta de ahorro' },
  { value: 'credito', label: 'Tarjeta de crédito' },
  { value: 'efectivo', label: 'Efectivo' },
];

const ICONS = ['landmark', 'piggy-bank', 'credit-card', 'wallet'];

export default function BankForm({ onClose, existing }: { onClose: () => void; existing?: Bank }) {
  const { addBank, updateBank, deleteBank } = useAppData();
  const { accent, dark } = useTheme();
  const COLORS = getChartPalette(accent, dark);
  const [nombre, setNombre] = useState(existing?.nombre ?? '');
  const [tipo, setTipo] = useState<AccountType>(existing?.tipo ?? 'corriente');
  const [saldoInicial, setSaldoInicial] = useState(existing ? String(existing.saldoInicial) : '');
  const [colorIndex, setColorIndex] = useState(existing?.colorIndex ?? 0);
  const [icono, setIcono] = useState(existing?.icono ?? ICONS[0]);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('Ingresá un nombre para el banco o cuenta.');
      return;
    }
    const bank: Bank = {
      id: existing?.id ?? crypto.randomUUID(),
      nombre: nombre.trim(),
      tipo,
      saldoInicial: parseFloat(saldoInicial) || 0,
      colorIndex,
      icono,
    };
    if (existing) updateBank(bank);
    else addBank(bank);
    onClose();
  };

  return (
    <Modal title={existing ? 'Editar banco' : 'Nuevo banco / cuenta'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className={formStyles.field}>
          <label className={formStyles.label}>Nombre</label>
          <input
            className={formStyles.input}
            type="text"
            placeholder="Ej. Cuenta Nómina"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />
        </div>

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Tipo</label>
            <select className={formStyles.select} value={tipo} onChange={(e) => setTipo(e.target.value as AccountType)}>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Saldo inicial</label>
            <input
              className={`${formStyles.input} ${formStyles.amountInput}`}
              type="number"
              step="0.01"
              placeholder="0.00"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
            />
          </div>
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label}>Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map((c, i) => (
              <button
                key={c}
                type="button"
                onClick={() => setColorIndex(i)}
                style={{
                  width: 28,
                  height: 28,
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

        <div className={formStyles.field}>
          <label className={formStyles.label}>Ícono</label>
          <select className={formStyles.select} value={icono} onChange={(e) => setIcono(e.target.value)}>
            <option value="landmark">Banco</option>
            <option value="piggy-bank">Alcancía</option>
            <option value="credit-card">Tarjeta</option>
            <option value="wallet">Billetera</option>
          </select>
        </div>

        {error && <div className={formStyles.error}>{error}</div>}

        <div className={formStyles.actions}>
          {existing && (
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                deleteBank(existing.id);
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
            {existing ? 'Guardar cambios' : 'Agregar banco'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
