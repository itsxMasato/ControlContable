import { useRef, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

const isMobile = () => window.matchMedia('(max-width: 640px)').matches;

/**
 * Arrastrar hacia abajo para cerrar una hoja inferior (solo en teléfono).
 * Se engancha a una "zona de agarre" (manija + encabezado); el arrastre empieza recién
 * después de 6 px para no interferir con los toques en botones o enlaces de esa zona.
 */
export function useSheetDrag(sheetRef: RefObject<HTMLElement | null>, onDismiss: () => void) {
  const state = useRef<{ startY: number; startT: number; dy: number; dragging: boolean; id: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (!isMobile() || e.button !== 0) return;
    state.current = { startY: e.clientY, startT: performance.now(), dy: 0, dragging: false, id: e.pointerId };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const s = state.current;
    const sheet = sheetRef.current;
    if (!s || !sheet || e.pointerId !== s.id) return;
    const dy = e.clientY - s.startY;
    if (!s.dragging) {
      if (dy < 6) return;
      s.dragging = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      sheet.style.transition = 'none';
      sheet.style.animation = 'none';
    }
    s.dy = Math.max(0, dy);
    // Resistencia leve: se mueve un poco menos que el dedo
    sheet.style.transform = `translateY(${s.dy * 0.92}px)`;
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    const s = state.current;
    const sheet = sheetRef.current;
    state.current = null;
    if (!s || !sheet || !s.dragging) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    const velocity = s.dy / Math.max(performance.now() - s.startT, 1); // px/ms
    const shouldClose = s.dy > Math.min(160, sheet.offsetHeight * 0.3) || velocity > 0.6;
    sheet.style.transition = 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)';
    if (shouldClose) {
      sheet.style.transform = 'translateY(105%)';
      navigator.vibrate?.(6);
      window.setTimeout(onDismiss, 200);
    } else {
      sheet.style.transform = '';
    }
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };
}
