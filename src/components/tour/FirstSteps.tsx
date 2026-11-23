import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Check, ChevronRight, CirclePlay, Landmark, PiggyBank, Tags, Target, X } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { startTour } from './GuidedTour';
import styles from './FirstSteps.module.css';

/**
 * Lista de primeros pasos que se marca sola a partir de los datos reales del usuario.
 * Desaparece cuando todo está completo o si el usuario la oculta.
 */
export default function FirstSteps() {
  const { data, updateSettings } = useAppData();
  const navigate = useNavigate();
  const { banks, categories, transactions, allocations, savingsGoals, settings } = data;

  const steps = [
    { done: banks.length > 0, icon: Landmark, label: 'Agregá tu primera cuenta', hint: 'Banco, efectivo o tarjeta con su saldo real', to: '/bancos' },
    { done: categories.some((c) => c.presupuestoMensual), icon: Tags, label: 'Poné un presupuesto a una categoría', hint: 'Así sabés cuándo te pasás', to: '/categorias' },
    { done: transactions.some((t) => !t.transferId), icon: ArrowLeftRight, label: 'Registrá un movimiento', hint: 'Un gasto o ingreso de hoy', to: '/transacciones' },
    { done: allocations.length > 0 || transactions.some((t) => t.apartado), icon: PiggyBank, label: 'Apartá dinero para un pago', hint: 'Vinculalo a una categoría', to: '/bancos' },
    { done: savingsGoals.length > 0, icon: Target, label: 'Creá una meta de ahorro', hint: 'Con monto y fecha objetivo', to: '/ahorros' },
  ];

  const completed = steps.filter((s) => s.done).length;
  if (settings.primerosPasosOcultos || completed === steps.length) return null;
  const pct = (completed / steps.length) * 100;

  return (
    <section className={`card ${styles.card}`}>
      <div className={styles.head}>
        <div className={styles.ring} style={{ '--pct': `${pct}%` } as React.CSSProperties}>
          <span>
            {completed}/{steps.length}
          </span>
        </div>
        <div className={styles.headText}>
          <div className={styles.title}>Primeros pasos</div>
          <div className={styles.sub}>Completalos para sacarle todo el provecho a la app.</div>
        </div>
        <button
          className={styles.hide}
          onClick={() => updateSettings({ primerosPasosOcultos: true })}
          aria-label="Ocultar primeros pasos"
          title="Ocultar"
        >
          <X size={16} />
        </button>
      </div>

      <div className={styles.list}>
        {steps.map(({ done, icon: Icon, label, hint, to }) => (
          <button key={label} className={`${styles.item} ${done ? styles.itemDone : ''}`} onClick={() => navigate(to)}>
            <span className={styles.check}>{done ? <Check size={14} strokeWidth={3} /> : <Icon size={15} />}</span>
            <span className={styles.itemText}>
              <span className={styles.itemLabel}>{label}</span>
              {!done && <span className={styles.itemHint}>{hint}</span>}
            </span>
            {!done && <ChevronRight size={16} className={styles.chev} />}
          </button>
        ))}
      </div>

      <button className={styles.tour} onClick={startTour}>
        <CirclePlay size={16} /> Ver el recorrido guiado
      </button>
    </section>
  );
}
