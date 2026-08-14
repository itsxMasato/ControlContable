import { useRef, useState } from 'react';
import { Download, FileSpreadsheet, LogOut, Plus, Upload } from 'lucide-react';
import styles from './Settings.module.css';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import RecurringPaymentForm from '../../components/forms/RecurringPaymentForm';
import { CURRENCY_OPTIONS, formatMoney } from '../../utils/currency';
import { ACCENT_OPTIONS } from '../../utils/themePresets';
import { exportToExcel } from '../../utils/excelExport';
import { AI_MODELS } from '../../utils/aiProviders';
import type { AIProvider, AppData, Currency, RecurringPayment } from '../../types';

export default function Settings() {
  const { data, updateSettings, clearAll, importData } = useAppData();
  const { dark, toggleDark, accent, setAccent } = useTheme();
  const { user, signOutUser } = useAuth();
  const [editingRecurring, setEditingRecurring] = useState<RecurringPayment | 'new' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportExcel = () => exportToExcel(data);

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `libro-de-gastos-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as AppData;
        if (!parsed.banks || !parsed.categories || !parsed.transactions) throw new Error('Formato inválido');
        importData(parsed);
      } catch {
        alert('El archivo no tiene un formato de respaldo válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Preferencias de la app y datos locales</p>
        </div>
      </div>

      <div className={`card ${styles.section}`}>
        <div className="section-title">Cuenta</div>
        <div className={styles.row}>
          <div>
            <div className={styles.rowLabel}>{user?.email}</div>
            <div className={styles.rowSub}>Tus datos están vinculados a esta cuenta.</div>
          </div>
          <Button variant="secondary" icon={<LogOut size={16} />} onClick={() => signOutUser()}>
            Cerrar sesión
          </Button>
        </div>
      </div>

      <div className={`card ${styles.section}`}>
        <div className="section-title">Apariencia</div>
        <div className={styles.row}>
          <div>
            <div className={styles.rowLabel}>Modo oscuro</div>
            <div className={styles.rowSub}>Alterná entre el papel claro y el modo oscuro del libro.</div>
          </div>
          <button className={`${styles.switch} ${dark ? styles.switchOn : ''}`} onClick={toggleDark} aria-label="Alternar modo oscuro">
            <span className={`${styles.switchKnob} ${dark ? styles.switchKnobOn : ''}`} />
          </button>
        </div>
        <div className={styles.row}>
          <div>
            <div className={styles.rowLabel}>Paleta de colores</div>
            <div className={styles.rowSub}>Cambia el fondo, las tarjetas y los acentos de toda la app.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {ACCENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAccent(opt.value)}
                aria-label={opt.label}
                title={opt.label}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: opt.swatch,
                  border: accent === opt.value ? '2px solid var(--ink)' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
        <div className={styles.row}>
          <div>
            <div className={styles.rowLabel}>Moneda</div>
            <div className={styles.rowSub}>Se usa para formatear todos los montos de la app.</div>
          </div>
          <select
            className={styles.select}
            value={data.settings.moneda}
            onChange={(e) => updateSettings({ moneda: e.target.value as Currency })}
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={`card ${styles.section}`}>
        <div className="section-title">Asistente de IA</div>
        <p className={styles.rowSub} style={{ marginBottom: 12 }}>
          Conectá tu propia cuenta de OpenAI, Claude o Gemini para pedirle recomendaciones sobre tus finanzas desde
          "Asistente IA" en el menú. Tu clave se guarda en tu cuenta y se usa solo desde tu navegador para hablar
          directo con el proveedor que elijas — esta app nunca la ve ni la comparte.
        </p>
        <div className={styles.row}>
          <div>
            <div className={styles.rowLabel}>Proveedor</div>
            <div className={styles.rowSub}>Qué IA vas a usar.</div>
          </div>
          <select
            className={styles.select}
            value={data.settings.ia.proveedor ?? ''}
            onChange={(e) => {
              const proveedor = (e.target.value || null) as AIProvider | null;
              updateSettings({ ia: { ...data.settings.ia, proveedor } });
            }}
          >
            <option value="">Ninguno</option>
            <option value="openai">ChatGPT (OpenAI)</option>
            <option value="claude">Claude (Anthropic)</option>
            <option value="gemini">Gemini (Google)</option>
          </select>
        </div>
        {data.settings.ia.proveedor && (
          <div className={styles.row}>
            <div>
              <div className={styles.rowLabel}>Clave de API</div>
              <div className={styles.rowSub}>
                Se pega tal cual la generás en el panel del proveedor. El modelo se elige automáticamente ({AI_MODELS[data.settings.ia.proveedor]}).
              </div>
            </div>
            <input
              className={styles.select}
              type="password"
              placeholder="sk-..."
              value={data.settings.ia.apiKey}
              onChange={(e) => updateSettings({ ia: { ...data.settings.ia, apiKey: e.target.value } })}
              style={{ minWidth: 220 }}
            />
          </div>
        )}
      </div>

      <div className={`card ${styles.section}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span className="section-title" style={{ marginBottom: 0 }}>
            Pagos recurrentes
          </span>
          <Button size="small" variant="secondary" icon={<Plus size={14} />} onClick={() => setEditingRecurring('new')}>
            Agregar
          </Button>
        </div>
        <p className={styles.rowSub} style={{ marginBottom: 12 }}>
          Alimentan la alerta de "pago próximo" cuando faltan 7 días o menos para su vencimiento.
        </p>
        {data.recurringPayments.length === 0 ? (
          <p className="text-faint" style={{ fontSize: 13 }}>
            No tenés pagos recurrentes configurados.
          </p>
        ) : (
          data.recurringPayments.map((rp) => (
            <div key={rp.id} className={styles.recurringItem} onClick={() => setEditingRecurring(rp)}>
              <div>
                <div className={styles.rowLabel}>{rp.nombre}</div>
                <div className={styles.rowSub}>Vence el día {rp.diaDeVencimiento} de cada mes</div>
              </div>
              <span className="mono" style={{ fontWeight: 600 }}>
                {formatMoney(rp.monto, data.settings.moneda)}
              </span>
            </div>
          ))
        )}
      </div>

      <div className={`card ${styles.section}`}>
        <div className="section-title">Respaldo de datos</div>
        <div className={styles.row}>
          <div>
            <div className={styles.rowLabel}>Exportar a Excel</div>
            <div className={styles.rowSub}>Descargá un .xlsx con transacciones, bancos, categorías, metas y más, en hojas separadas.</div>
          </div>
          <Button variant="secondary" icon={<FileSpreadsheet size={16} />} onClick={handleExportExcel}>
            Exportar Excel
          </Button>
        </div>
        <div className={styles.row}>
          <div>
            <div className={styles.rowLabel}>Exportar respaldo</div>
            <div className={styles.rowSub}>Descargá un archivo JSON con todos tus datos.</div>
          </div>
          <Button variant="secondary" icon={<Download size={16} />} onClick={handleExportBackup}>
            Exportar
          </Button>
        </div>
        <div className={styles.row}>
          <div>
            <div className={styles.rowLabel}>Importar respaldo</div>
            <div className={styles.rowSub}>Reemplaza los datos actuales con los del archivo.</div>
          </div>
          <Button variant="secondary" icon={<Upload size={16} />} onClick={() => fileInputRef.current?.click()}>
            Importar
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportFile} />
        </div>
      </div>

      <div className="card">
        <div className="section-title">Zona de datos</div>
        <div className={styles.row}>
          <div>
            <div className={styles.rowLabel}>Borrar todos los datos</div>
            <div className={styles.rowSub}>Elimina bancos, transacciones, categorías, metas y apartados. No se puede deshacer.</div>
          </div>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Esto borrará TODOS tus datos permanentemente. ¿Continuar?')) clearAll();
            }}
          >
            Borrar todo
          </Button>
        </div>
      </div>

      {editingRecurring && (
        <RecurringPaymentForm
          onClose={() => setEditingRecurring(null)}
          existing={editingRecurring === 'new' ? undefined : editingRecurring}
        />
      )}
    </div>
  );
}
