import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Lightbulb, X } from 'lucide-react';
import { TOUR_STEPS } from './tourSteps';
import styles from './GuidedTour.module.css';
import { useAppData } from '../../context/AppDataContext';
import { useBackClose } from '../../hooks/useBackClose';

export const START_TOUR_EVENT = 'libro:start-tour';

/** Lanza el tutorial desde cualquier parte (ej. botón en Configuración). */
export function startTour() {
  window.dispatchEvent(new Event(START_TOUR_EVENT));
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;

function findVisible(selector: string): HTMLElement | null {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
  return (
    nodes.find((n) => {
      const r = n.getBoundingClientRect();
      const cs = getComputedStyle(n);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
    }) ?? null
  );
}

function TourOverlay({ onFinish }: { onFinish: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number; placement: 'top' | 'bottom' | 'center' }>({
    top: 0,
    left: 0,
    placement: 'center',
  });

  const step = TOUR_STEPS[index];
  const isLast = index === TOUR_STEPS.length - 1;
  const Icon = step.icon;

  useBackClose(onFinish);

  // 1) Ir a la ruta del paso y esperar a que el elemento aparezca (máx. ~1.5 s)
  useEffect(() => {
    setReady(false);
    if (location.pathname !== step.route) {
      navigate(step.route, { replace: true });
      return;
    }
    if (!step.target) {
      targetRef.current = null;
      setRect(null);
      setReady(true);
      return;
    }
    let tries = 0;
    let raf = 0;
    let timer = 0;
    const look = () => {
      const el = findVisible(step.target!);
      if (el) {
        targetRef.current = el;
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        timer = window.setTimeout(() => {
          const r = el.getBoundingClientRect();
          setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
          setReady(true);
        }, 380);
        return;
      }
      if (++tries > 45) {
        // No existe en esta pantalla (ej. aún no hay cuentas): se muestra centrado
        targetRef.current = null;
        setRect(null);
        setReady(true);
        return;
      }
      raf = requestAnimationFrame(look);
    };
    look();
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [index, step, location.pathname, navigate]);

  // 2) Mantener el foco alineado al hacer scroll o rotar la pantalla
  useEffect(() => {
    const update = () => {
      const el = targetRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
    };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, []);

  // 3) Ubicar la tarjeta junto al elemento, sin salirse de la pantalla
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || !ready) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    if (!rect) {
      setCardPos({ top: Math.max(16, (vh - ch) / 2), left: Math.max(16, (vw - cw) / 2), placement: 'center' });
      return;
    }
    const spaceBelow = vh - (rect.top + rect.height);
    const placement = spaceBelow >= ch + 24 || spaceBelow > rect.top ? 'bottom' : 'top';
    let top = placement === 'bottom' ? rect.top + rect.height + 14 : rect.top - ch - 14;
    top = Math.min(Math.max(12, top), vh - ch - 12);
    let left = rect.left + rect.width / 2 - cw / 2;
    left = Math.min(Math.max(12, left), vw - cw - 12);
    setCardPos({ top, left, placement });
  }, [rect, ready, index]);

  const next = useCallback(() => {
    if (isLast) onFinish();
    else setIndex((i) => i + 1);
  }, [isLast, onFinish]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') onFinish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onFinish]);

  // Deslizar la tarjeta a los lados también cambia de paso (táctil)
  const touch = useRef<{ x: number; y: number } | null>(null);

  return createPortal(
    <div className={styles.root} role="dialog" aria-modal="true" aria-label="Tutorial guiado">
      {rect ? (
        <div
          className={styles.spotlight}
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          aria-hidden="true"
        />
      ) : (
        <div className={styles.scrim} aria-hidden="true" />
      )}
      {/* Capa que bloquea toques en la app mientras dura el tour */}
      <div className={styles.blocker} />

      <div
        ref={cardRef}
        key={index}
        className={`${styles.card} ${ready ? styles.cardReady : ''}`}
        data-placement={cardPos.placement}
        style={{ top: cardPos.top, left: cardPos.left }}
        onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          const t = touch.current;
          touch.current = null;
          if (!t) return;
          const dx = e.changedTouches[0].clientX - t.x;
          const dy = e.changedTouches[0].clientY - t.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            if (dx < 0) next();
            else prev();
          }
        }}
      >
        <div className={styles.header}>
          <span className={styles.icon}>
            <Icon size={20} strokeWidth={2} />
          </span>
          <span className={styles.counter}>
            {index + 1} de {TOUR_STEPS.length}
          </span>
          <button className={styles.skip} onClick={onFinish} aria-label="Cerrar tutorial">
            <X size={16} />
          </button>
        </div>
        <h2 className={styles.title}>{step.title}</h2>
        <p className={styles.body}>{step.body}</p>
        {step.tip && (
          <div className={styles.tip}>
            <Lightbulb size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{step.tip}</span>
          </div>
        )}
        <div className={styles.progress} aria-hidden="true">
          {TOUR_STEPS.map((_, i) => (
            <span key={i} className={`${styles.dot} ${i === index ? styles.dotActive : ''} ${i < index ? styles.dotDone : ''}`} />
          ))}
        </div>
        <div className={styles.actions}>
          {index === 0 ? (
            <button className={styles.ghost} onClick={onFinish}>
              Omitir
            </button>
          ) : (
            <button className={styles.ghost} onClick={prev}>
              <ArrowLeft size={15} /> Anterior
            </button>
          )}
          <button className={styles.primary} onClick={next} autoFocus>
            {isLast ? (
              <>
                <Check size={16} /> Empezar
              </>
            ) : index === 0 ? (
              <>
                Comenzar recorrido <ArrowRight size={15} />
              </>
            ) : (
              <>
                Siguiente <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Se muestra solo la primera vez (hasta que el usuario lo termina u omite) y se puede relanzar
 * con `startTour()`. El estado "visto" se guarda en la cuenta, así no reaparece en otro dispositivo.
 */
export default function GuidedTour() {
  const { data, updateSettings } = useAppData();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (data.settings.tutorialVisto) return;
    const t = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(t);
    // solo al montar: si el usuario lo cierra no se vuelve a abrir en esta sesión
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const start = () => setOpen(true);
    window.addEventListener(START_TOUR_EVENT, start);
    return () => window.removeEventListener(START_TOUR_EVENT, start);
  }, []);

  const finish = useCallback(() => {
    setOpen(false);
    if (!data.settings.tutorialVisto) updateSettings({ tutorialVisto: true });
    navigate('/', { replace: true });
  }, [data.settings.tutorialVisto, updateSettings, navigate]);

  return open ? <TourOverlay onFinish={finish} /> : null;
}
