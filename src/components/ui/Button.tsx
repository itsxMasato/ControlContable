import { useEffect, useRef, useState, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'default' | 'small';
  full?: boolean;
  icon?: ReactNode;
  /**
   * Para acciones destructivas (variant="danger" la activa por defecto): el primer toque "arma" el
   * botón y muestra este texto; hay que tocar otra vez dentro de 4 s para ejecutar. Evita borrados
   * accidentales. Pasá `confirmText={false}` para desactivarlo.
   */
  confirmText?: string | false;
}

export default function Button({
  variant = 'secondary',
  size = 'default',
  full,
  icon,
  className,
  children,
  confirmText,
  onClick,
  ...rest
}: ButtonProps) {
  const needsConfirm = confirmText !== false && (variant === 'danger' || typeof confirmText === 'string');
  const [armed, setArmed] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (needsConfirm && !armed) {
      e.preventDefault();
      setArmed(true);
      navigator.vibrate?.(12);
      timer.current = window.setTimeout(() => setArmed(false), 4000);
      return;
    }
    window.clearTimeout(timer.current);
    setArmed(false);
    onClick?.(e);
  };

  const classes = [
    styles.btn,
    styles[variant],
    size === 'small' ? styles.small : '',
    full ? styles.full : '',
    armed ? styles.armed : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} onClick={handleClick} {...rest}>
      {armed ? <TriangleAlert size={16} /> : icon}
      {armed ? (typeof confirmText === 'string' ? confirmText : 'Tocá de nuevo para confirmar') : children}
    </button>
  );
}
