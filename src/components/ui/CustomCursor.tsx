import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './CustomCursor.module.css';

const INTERACTIVE = 'a, button, [role="button"], [role="tab"], select, label, summary, input[type="checkbox"], input[type="radio"], input[type="color"], [data-cursor="hover"]';
const TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="color"]):not([type="range"]), textarea, [contenteditable="true"]';

/**
 * Cursor animado: un punto que sigue al mouse exacto y un anillo que lo persigue con inercia.
 * - Sobre elementos clickeables el anillo crece y se rellena con el color de acento.
 * - Sobre campos de texto se oculta y vuelve el cursor de texto normal del sistema.
 * - Al hacer clic se contrae y lanza una onda.
 * Solo se activa con mouse (pointer: fine) y sin "reducir movimiento"; en táctil no hace nada.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const enabled =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const layer = layerRef.current!;
    const root = document.documentElement;
    root.classList.add('has-custom-cursor');

    let mx = -100;
    let my = -100;
    let rx = -100;
    let ry = -100;
    let raf = 0;
    let visible = false;

    const loop = () => {
      // Interpolación: el anillo recorre el 18% de la distancia en cada cuadro
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const setState = (target: EventTarget | null) => {
      const el = target instanceof Element ? target : null;
      const isText = Boolean(el?.closest(TEXT));
      const isHover = !isText && Boolean(el?.closest(INTERACTIVE));
      layer.dataset.state = isText ? 'text' : isHover ? 'hover' : 'default';
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        rx = mx;
        ry = my;
        layer.dataset.visible = 'true';
      }
    };
    const onOver = (e: PointerEvent) => setState(e.target);
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      layer.dataset.pressed = 'true';
      const burst = document.createElement('span');
      burst.className = styles.burst;
      burst.style.left = `${e.clientX}px`;
      burst.style.top = `${e.clientY}px`;
      layer.appendChild(burst);
      burst.addEventListener('animationend', () => burst.remove());
    };
    const onUp = () => {
      layer.dataset.pressed = 'false';
    };
    const onLeave = () => {
      visible = false;
      layer.dataset.visible = 'false';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return createPortal(
    <div ref={layerRef} className={styles.layer} data-state="default" data-visible="false" aria-hidden="true">
      <div ref={ringRef} className={styles.ringPos}>
        <div className={styles.ring} />
      </div>
      <div ref={dotRef} className={styles.dotPos}>
        <div className={styles.dot} />
      </div>
    </div>,
    document.body
  );
}
