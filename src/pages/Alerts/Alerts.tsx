import { useNavigate } from 'react-router-dom';
import styles from './Alerts.module.css';
import { useAppData } from '../../context/AppDataContext';
import { useAlerts } from '../../hooks/useAlerts';
import SeverityIcon from '../../components/ui/SeverityIcon';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import type { AlertType } from '../../types';

const SECTIONS: { tipo: AlertType; title: string }[] = [
  { tipo: 'presupuesto_excedido', title: 'Presupuesto excedido' },
  { tipo: 'gasto_inusual', title: 'Gasto inusual detectado' },
  { tipo: 'pago_proximo', title: 'Pagos recurrentes próximos' },
  { tipo: 'meta_alcanzada', title: 'Metas de ahorro alcanzadas' },
];

export default function Alerts() {
  const alerts = useAlerts();
  const { dismissAlert, dismissAllAlerts } = useAppData();
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alertas</h1>
          <p className="page-subtitle">{alerts.length} aviso{alerts.length === 1 ? '' : 's'} activo{alerts.length === 1 ? '' : 's'}</p>
        </div>
        {alerts.length > 0 && (
          <Button variant="secondary" onClick={() => dismissAllAlerts(alerts.map((a) => a.id))}>
            Descartar todas
          </Button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="card">
          <EmptyState title="Todo en orden" subtitle="No tenés alertas activas. Te avisaremos cuando algo necesite tu atención." />
        </div>
      ) : (
        SECTIONS.map((section) => {
          const items = alerts.filter((a) => a.tipo === section.tipo);
          if (items.length === 0) return null;
          return (
            <div key={section.tipo} className={styles.section}>
              <div className={styles.sectionHeader}>{section.title}</div>
              {items.map((a) => (
                <div key={a.id} className={`card ${styles.alertCard}`}>
                  <SeverityIcon severity={a.severidad} />
                  <div className={styles.alertBody}>
                    <div className={styles.alertTitle}>{a.titulo}</div>
                    <p className="text-soft" style={{ fontSize: 13.5 }}>
                      {a.descripcion}
                    </p>
                    <div className={styles.alertActions}>
                      {a.accionRuta && (
                        <Button size="small" variant="secondary" onClick={() => navigate(a.accionRuta!)}>
                          {a.accionLabel ?? 'Ver más'}
                        </Button>
                      )}
                      <Button size="small" variant="ghost" onClick={() => dismissAlert(a.id)}>
                        Descartar
                      </Button>
                    </div>
                  </div>
                  <Badge tone={a.severidad === 'advertencia' ? 'brick' : a.severidad === 'logro' ? 'forest' : 'slate'}>
                    {a.severidad}
                  </Badge>
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
