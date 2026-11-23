import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import IconPicker from '../ui/IconPicker';
import formStyles from '../ui/Form.module.css';
import styles from './BankForm.module.css';
import { useAppData } from '../../context/AppDataContext';
import { useTheme } from '../../context/ThemeContext';
import { getChartPalette } from '../../utils/chartPalette';
import { ACCOUNT_TYPES, accountTypeInfo, roundMoney } from '../../utils/accounts';
import { getIcon } from '../ui/iconMap';
import type { AccountType, Bank } from '../../types';

export default function BankForm({ onClose, existing }: { onClose: () => void; existing?: Bank }) {
  const { data, addBank, updateBank, deleteBank } = useAppData();
  const { accent, dark } = useTheme();
  const COLORS = getChartPalette(accent, dark);
  const [nombre, setNombre] = useState(existing?.nombre ?? '');
  const [tipo, setTipo] = useState<AccountType>(existing?.tipo ?? 'corriente');
  const info = accountTypeInfo(tipo);
  // En cuentas de deuda el usuario escribe cuánto debe (positivo); internamente se guarda como saldo negativo
  const [saldoInicial, setSaldoInicial] = useState(
    existing ? String(accountTypeInfo(existing.tipo).liability ? -existing.saldoInicial : existing.saldoInicial) : ''
  );
  const [limite, setLimite] = useState(existing?.limiteCredito ? String(existing.limiteCredito) : '');
  const [colorIndex, setColorIndex] = useState(existing?.colorIndex ?? 0);
  const [icono, setIcono] = useState(existing?.icono ?? info.icon);
  const [iconoTocado, setIconoTocado] = useState(Boolean(existing));
  const [error, setError] = useState('');

  const txCount = existing ? data.transactions.filter((t) => t.bankId === existing.id).length : 0;

  const chooseType = (next: AccountType) => {
    const nextInfo = accountTypeInfo(next);
    // Si cambia entre activo y pasivo, el número escrito mantiene su significado (saldo ↔ deuda)
    setTipo(next);
    if (!iconoTocado) setIcono(nextInfo.icon);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('Ingresá un nombre para el banco o cuenta.');
      return;
    }
    const raw = parseFloat(saldoInicial) || 0;
    if (info.liability && raw < 0) {
      setError('Escribí la deuda como número positivo (ej. 1500 si debés 1500).');
      return;
    }
    const limiteNum = parseFloat(limite) || 0;
    if (tipo === 'credito' && limiteNum > 0 && raw > limiteNum) {
      setError('La deuda actual no puede ser mayor al límite de la tarjeta.');
      return;
    }
    const bank: Bank = {
      id: existing?.id ?? crypto.randomUUID(),
      nombre: nombre.trim(),
      tipo,
      saldoInicial: roundMoney(info.liability ? -raw : raw),
      colorIndex,
      icono,
      limiteCredito: tipo === 'credito' && limiteNum > 0 ? roundMoney(limiteNum) : null,
    };
    if (existing) updateBank(bank);
    else addBank(bank);
    onClose();
  };

  return (
    <Modal title={existing ? 'Editar cuenta' : 'Nueva cuenta'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className={formStyles.field}>
          <label className={formStyles.label}>Tipo de cuenta</label>
          <div className={styles.types}>
            {ACCOUNT_TYPES.map((t) => {
              const Icon = getIcon(t.icon);
              const selected = t.value === tipo;
              return (
                <button
                  key={t.value}
                  type="button"
                  className={`${styles.type} ${selected ? styles.typeSelected : ''}`}
                  onClick={() => chooseType(t.value)}
                  aria-pressed={selected}
                >
                  <span className={styles.typeIcon}>
                    <Icon size={18} strokeWidth={1.9} />
                  </span>
                  <span className={styles.typeText}>
                    <span className={styles.typeLabel}>{t.label}</span>
                    <span className={styles.typeHint}>{t.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label}>Nombre</label>
          <input
            className={formStyles.input}
            type="text"
            placeholder={info.liability ? 'Ej. Visa Banco Atlántida' : 'Ej. Cuenta Nómina'}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>{info.liability ? 'Deuda actual' : 'Saldo inicial'}</label>
            <input
              className={`${formStyles.input} ${formStyles.amountInput}`}
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
            />
          </div>
          {tipo === 'credito' && (
            <div className={formStyles.field}>
              <label className={formStyles.label}>Límite de crédito</label>
              <input
                className={`${formStyles.input} ${formStyles.amountInput}`}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={limite}
                onChange={(e) => setLimite(e.target.value)}
              />
            </div>
          )}
        </div>
        <p className="text-faint" style={{ fontSize: 12.5, marginTop: -8, marginBottom: 16 }}>
          {info.liability
            ? 'Cada gasto con esta cuenta aumenta la deuda; cada pago (ingreso o transferencia hacia ella) la reduce.'
            : 'El saldo con el que arranca la cuenta hoy. Los movimientos que registres se suman o restan a este.'}
        </p>

        <div className={formStyles.field}>
          <label className={formStyles.label}>Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map((c, i) => (
              <button
                key={c}
                type="button"
                onClick={() => setColorIndex(i)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: c,
                  border: '3px solid var(--card)',
                  outline: colorIndex === i ? '2px solid var(--ink)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'transform 160ms ease',
                  transform: colorIndex === i ? 'scale(1.1)' : 'none',
                }}
                aria-label={`Color ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label}>Ícono</label>
          <IconPicker
            value={icono}
            onChange={(v) => {
              setIcono(v);
              setIconoTocado(true);
            }}
            preferredGroup="Cuentas y finanzas"
          />
        </div>

        {error && <div className={formStyles.error}>{error}</div>}

        <div className={formStyles.actions}>
          {existing && (
            <Button
              type="button"
              variant="danger"
              confirmText={txCount > 0 ? `Se borrarán ${txCount} movimientos. ¿Seguro?` : 'Tocá de nuevo para eliminar'}
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
            {existing ? 'Guardar cambios' : 'Agregar cuenta'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
