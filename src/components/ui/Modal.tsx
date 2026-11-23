import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';
import { useBackClose } from '../../hooks/useBackClose';
import { useSheetDrag } from '../../hooks/useSheetDrag';

const EXIT_MS = 220;

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [closing, setClosing] = useState(false);
  // Si el usuario ya escribió algo, un toque accidental fuera del modal no lo cierra (evita perder datos).
  const dirtyRef = useRef(false);
  const [shake, setShake] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closingRef = useRef(false);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(() => onCloseRef.current(), EXIT_MS);
  }, []);

  useBackClose(requestClose);

  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useSheetDrag(sheetRef, () => {
    closingRef.current = true;
    onCloseRef.current();
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [requestClose]);

  const onBackdrop = () => {
    if (dirtyRef.current) {
      setShake(true);
      window.setTimeout(() => setShake(false), 400);
      return;
    }
    requestClose();
  };

  return createPortal(
    <div
      className={`${styles.overlay} ${closing ? styles.overlayClosing : ''}`}
      onMouseDown={(e) => e.target === e.currentTarget && onBackdrop()}
    >
      <div
        ref={sheetRef}
        className={`${styles.modal} ${closing ? styles.modalClosing : ''} ${shake ? styles.shake : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onInput={() => {
          dirtyRef.current = true;
        }}
      >
        <div className={styles.grab} {...drag}>
          <div className={styles.handle} aria-hidden="true" />
          <div className={styles.header}>
            <span className={styles.title}>{title}</span>
            <button className={styles.closeBtn} onClick={requestClose} aria-label="Cerrar" type="button">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
