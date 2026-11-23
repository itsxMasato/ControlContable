import { useMemo, useState } from 'react';
import { CircleCheck, Scale } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import formStyles from '../ui/Form.module.css';
import styles from './CutForm.module.css';
import { useAppData } from '../../context/AppDataContext';
import { computeCutPreview, lastCut } from '../../utils/cuts';
import { formatMoney } from '../../utils/currency';
import { formatDateShort, todayISO } from '../../utils/dates';
import { isLiability, roundMoney } from '../../utils/accounts';

export default function CutForm({ onClose }: { onClose: () => void }) {
  const { data, addCut } = useAppData();
  const currency = data.settings.moneda;
  const previous = lastCut(data.cuts ?? []);
  const desde = previous?.fecha ?? null;

  const [fecha, setFecha] = useState(todayISO());
  const [nombre, setNombre] = useState('');
  const [nota, setNota] = useState('');
  /** Texto escrito por cuenta (vacío = coincide con la app). En cuentas de deuda se escribe la deuda en positivo. */
  const [reales, setReales] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const preview = useMemo(
    () => computeCutPreview(data.banks, data.transactions, desde, fecha),
    [data.banks, data.transactions, desde, fecha]
  );

  const saldoRealDe = (bankId: string, saldoSistema: number): number => {
    const raw = reales[bankId];
    if (raw === undefined || raw.trim() === '') return saldoSistema;
    const n = parseFloat(raw);
    if (Number.isNaN(n)) return saldoSistema;
    const bank = data.banks.find((b) => b.id === bankId);
    return roundMoney(bank && isLiability(bank) ? -n : n);
  };

  const ajustes = preview.cuentas.map((c) => roundMoney(saldoRealDe(c.bankId, c.saldoSistema) - c.saldoSistema));
  const totalAjustes = roundMoney(ajustes.reduce((s, a) => s + a, 0));
  const hayAjustes = ajustes.some((a) => Math.abs(a) >= 0.01);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fecha > todayISO()) {
      setError('El corte no puede tener una fecha futura.');
      return;
    }
    if (desde && fecha <= desde) {
      setError(`La fecha debe ser posterior al último corte (${formatDateShort(desde)}).`);
      return;
    }
    if (data.banks.length === 0) {
      setError('Primero agregá al menos una cuenta.');
      return;
    }
    const saldosReales: Record<string, number> = {};
    for (const c of preview.cuentas) saldosReales[c.bankId] = saldoRealDe(c.bankId, c.saldoSistema);
    addCut({ fecha, nombre, nota, saldosReales });
    onClose();
  };

  return (
    <Modal title="Hacer un corte" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p className={styles.intro}>
          Cierra el período {desde ? `desde el ${formatDateShort(desde)}` : 'desde el inicio'} hasta la fecha que elijas y
          guarda una foto de tus saldos. Si el saldo real del banco no coincide, se registra un ajuste para que todo cuadre.
        </p>

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Fecha de corte</label>
            <input
              className={formStyles.input}
              type="date"
              value={fecha}
              max={todayISO()}
              min={desde ?? undefined}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Nombre (opcional)</label>
            <input
              className={formStyles.input}
              type="text"
              placeholder="Ej. Cierre de quincena"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.summary}>
          <div>
            <span className={styles.summaryLabel}>Ingresos</span>
            <span className="mono text-income">{formatMoney(preview.totales.ingresos, currency)}</span>
          </div>
          <div>
            <span className={styles.summaryLabel}>Gastos</span>
            <span className="mono text-expense">{formatMoney(preview.totales.gastos, currency)}</span>
          </div>
          <div>
            <span className={styles.summaryLabel}>Neto</span>
            <span className={`mono ${preview.totales.neto < 0 ? 'text-expense' : 'text-income'}`}>
              {formatMoney(preview.totales.neto, currency)}
            </span>
          </div>
        </div>

        <div className={formStyles.label} style={{ marginBottom: 8 }}>
          Conciliá cada cuenta con su saldo real (opcional)
        </div>
        <div className={styles.accounts}>
          {preview.cuentas.map((c, i) => {
            const bank = data.banks.find((b) => b.id === c.bankId);
            const deuda = bank ? isLiability(bank) : false;
            const sistemaMostrado = deuda ? -c.saldoSistema : c.saldoSistema;
            const ajuste = ajustes[i];
            return (
              <div key={c.bankId} className={styles.account}>
                <div className={styles.accountHead}>
                  <span className={styles.accountName}>{c.nombre}</span>
                  <span className="text-faint" style={{ fontSize: 12 }}>
                    {deuda ? 'Deuda según la app' : 'Según la app'}:{' '}
                    <strong className="mono">{formatMoney(sistemaMostrado, currency)}</strong>
                  </span>
                </div>
                <div className={styles.accountRow}>
                  <input
                    className={`${formStyles.input} mono`}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder={`${deuda ? 'Deuda' : 'Saldo'} real: ${sistemaMostrado.toFixed(2)}`}
                    value={reales[c.bankId] ?? ''}
                    onChange={(e) => setReales((r) => ({ ...r, [c.bankId]: e.target.value }))}
                  />
                  <span
                    className={`${styles.diff} ${Math.abs(ajuste) < 0.01 ? styles.diffOk : ajuste > 0 ? styles.diffUp : styles.diffDown}`}
                  >
                    {Math.abs(ajuste) < 0.01 ? (
                      <>
                        <CircleCheck size={14} /> Cuadra
                      </>
                    ) : (
                      `${ajuste > 0 ? '+' : '−'}${formatMoney(Math.abs(ajuste), currency)}`
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {hayAjustes && (
          <div className={styles.adjustNotice}>
            <Scale size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Se registrarán ajustes por {totalAjustes >= 0 ? '+' : '−'}
              {formatMoney(Math.abs(totalAjustes), currency)} en la categoría "Ajuste de corte". No cuentan como ingreso
              ni gasto real en el resumen del corte. Si eliminás el corte, los ajustes se borran.
            </span>
          </div>
        )}

        <div className={formStyles.field}>
          <label className={formStyles.label}>Nota (opcional)</label>
          <input
            className={formStyles.input}
            type="text"
            placeholder="Algo para recordar de este período"
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
            Hacer corte ({preview.movimientos} movimiento{preview.movimientos === 1 ? '' : 's'})
          </Button>
        </div>
      </form>
    </Modal>
  );
}
