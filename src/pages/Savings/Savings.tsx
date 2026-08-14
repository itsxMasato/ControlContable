import { useState } from 'react';
import { Plus } from 'lucide-react';
import styles from './Savings.module.css';
import { useAppData } from '../../context/AppDataContext';
import { useTheme } from '../../context/ThemeContext';
import { getIcon } from '../../components/ui/iconMap';
import CircularProgress from '../../components/ui/CircularProgress';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import GoalForm from '../../components/forms/GoalForm';
import ContributionForm from '../../components/forms/ContributionForm';
import { goalCurrentAmount, projectedGoalDate } from '../../utils/calculations';
import { formatMoney } from '../../utils/currency';
import { resolveThemeColor } from '../../utils/chartPalette';
import { formatDateShort } from '../../utils/dates';
import type { Contribution, SavingsGoal } from '../../types';

export default function Savings() {
  const { data } = useAppData();
  const { savingsGoals, settings } = data;
  const { accent, dark } = useTheme();
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | 'new' | null>(null);
  const [contributionTarget, setContributionTarget] = useState<{ goal: SavingsGoal; existing?: Contribution } | null>(
    null
  );

  const allContributions = savingsGoals
    .flatMap((g) => g.contributions.map((c) => ({ ...c, goal: g })))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 12);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ahorros y metas</h1>
          <p className="page-subtitle">{savingsGoals.length} meta{savingsGoals.length === 1 ? '' : 's'} activa{savingsGoals.length === 1 ? '' : 's'}</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setEditingGoal('new')}>
          Nueva meta
        </Button>
      </div>

      <div className={`grid ${styles.grid}`}>
        {savingsGoals.map((goal) => {
          const Icon = getIcon(goal.icono);
          const goalColor = resolveThemeColor(goal.colorIndex, goal.id, accent, dark);
          const current = goalCurrentAmount(goal);
          const projected = projectedGoalDate(goal);
          const reached = current >= goal.montoObjetivo;
          const bank = data.banks.find((b) => b.id === goal.bankId);
          return (
            <div key={goal.id} className={`card ${styles.goalCard}`}>
              <div className={styles.goalHeader}>
                <span onClick={() => setEditingGoal(goal)} style={{ cursor: 'pointer' }} className={styles.goalName}>
                  {goal.nombre}
                </span>
              </div>
              <div className="text-faint" style={{ fontSize: 11.5, marginTop: -6, marginBottom: 4 }}>
                {bank ? `Se descuenta de ${bank.nombre}` : 'Sin cuenta asociada'}
              </div>
              <CircularProgress value={current} max={goal.montoObjetivo} color={reached ? 'var(--gold)' : goalColor}>
                <Icon size={18} strokeWidth={1.8} color={goalColor} style={{ marginBottom: 2 }} />
                <span className={styles.circleLabel}>{Math.min(100, Math.round((current / goal.montoObjetivo) * 100))}%</span>
              </CircularProgress>
              <div className={styles.amountsLine}>
                <span className="mono" style={{ fontWeight: 600, color: 'var(--ink)' }}>
                  {formatMoney(current, settings.moneda)}
                </span>{' '}
                de {formatMoney(goal.montoObjetivo, settings.moneda)}
              </div>
              <div className={styles.metaLine}>
                {reached ? '¡Meta alcanzada!' : projected ? `Estimado: ${formatDateShort(projected)}` : 'Sin proyección aún'}
              </div>
              <Button variant="secondary" size="small" full onClick={() => setContributionTarget({ goal })}>
                Agregar aporte
              </Button>
            </div>
          );
        })}
        <button className={styles.addCard} onClick={() => setEditingGoal('new')}>
          <Plus size={20} />
          Nueva meta de ahorro
        </button>
      </div>

      <div className="card">
        <div className="section-title">Aportes recientes</div>
        {allContributions.length === 0 ? (
          <EmptyState title="Sin aportes todavía" subtitle="Los aportes que registres a tus metas aparecerán aquí en orden cronológico." />
        ) : (
          <div className={styles.timeline}>
            {allContributions.map((c) => (
              <div
                key={c.id}
                className={styles.timelineItem}
                onClick={() => setContributionTarget({ goal: c.goal, existing: c })}
                style={{ cursor: 'pointer' }}
              >
                <span
                  className={styles.timelineDot}
                  style={{ background: resolveThemeColor(c.goal.colorIndex, c.goal.id, accent, dark) }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.goal.nombre}</div>
                    <div className="text-faint" style={{ fontSize: 12 }}>
                      {formatDateShort(c.fecha)} {c.nota && `· ${c.nota}`}
                    </div>
                  </div>
                  <div className="mono text-income" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    +{formatMoney(c.monto, settings.moneda)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingGoal && (
        <GoalForm onClose={() => setEditingGoal(null)} existing={editingGoal === 'new' ? undefined : editingGoal} />
      )}
      {contributionTarget && (
        <ContributionForm
          onClose={() => setContributionTarget(null)}
          goal={contributionTarget.goal}
          existing={contributionTarget.existing}
        />
      )}
    </div>
  );
}
