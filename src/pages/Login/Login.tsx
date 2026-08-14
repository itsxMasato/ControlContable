import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import styles from './Login.module.css';
import formStyles from '../../components/ui/Form.module.css';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { translateAuthError } from '../../utils/authErrors';

type Mode = 'login' | 'signup';

export default function Login() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !password) {
      setError('Completá tu correo y contraseña.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Ingresá tu correo para poder enviarte el enlace de recuperación.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSuccess('Te enviamos un correo con instrucciones para restablecer tu contraseña.');
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <BookOpen size={32} strokeWidth={1.6} className={styles.brandMark} />
          <div className={styles.brandTitle}>Libro de Gastos</div>
          <div className={styles.brandSubtitle}>
            {mode === 'login' ? 'Ingresá a tu cuenta' : 'Creá tu cuenta para empezar'}
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
            onClick={() => switchMode('login')}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={`${styles.tab} ${mode === 'signup' ? styles.tabActive : ''}`}
            onClick={() => switchMode('signup')}
          >
            Crear cuenta
          </button>
        </div>

        {error && <div className={`${styles.message} ${styles.messageError}`}>{error}</div>}
        {success && <div className={`${styles.message} ${styles.messageSuccess}`}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Correo electrónico</label>
            <input
              className={formStyles.input}
              type="email"
              autoComplete="email"
              placeholder="vos@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label}>Contraseña</label>
            <input
              className={formStyles.input}
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {mode === 'signup' && (
            <div className={formStyles.field}>
              <label className={formStyles.label}>Confirmar contraseña</label>
              <input
                className={formStyles.input}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          {mode === 'login' && (
            <button type="button" className={styles.forgotLink} onClick={handleForgotPassword}>
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <Button type="submit" variant="primary" full disabled={loading}>
            {loading ? 'Un momento…' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>
        </form>
      </div>
    </div>
  );
}
