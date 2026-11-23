import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { BrandMark } from '../../components/ui/Splash';
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
  const [showPassword, setShowPassword] = useState(false);

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
      <div className={styles.blobA} aria-hidden="true" />
      <div className={styles.blobB} aria-hidden="true" />
      <div className={styles.blobC} aria-hidden="true" />
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <BrandMark size={58} />
          </span>
          <div className={styles.brandTitle}>Libro de Gastos</div>
          <div className={styles.brandSubtitle}>
            {mode === 'login' ? 'Ingresá a tu cuenta' : 'Creá tu cuenta para empezar'}
          </div>
        </div>

        <div className={styles.tabs} data-mode={mode}>
          <span className={styles.tabIndicator} aria-hidden="true" />
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

        {error && <div key={error} className={`${styles.message} ${styles.messageError}`}>{error}</div>}
        {success && <div key={success} className={`${styles.message} ${styles.messageSuccess}`}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Correo electrónico</label>
            <div className={styles.inputWrap}>
            <Mail size={17} className={styles.inputIcon} />
            <input
              className={`${formStyles.input} ${styles.iconInput}`}
              type="email"
              autoComplete="email"
              placeholder="vos@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            </div>
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label}>Contraseña</label>
            <div className={styles.inputWrap}>
              <Lock size={17} className={styles.inputIcon} />
              <input
                className={`${formStyles.input} ${styles.iconInput}`}
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div className={formStyles.field}>
              <label className={formStyles.label}>Confirmar contraseña</label>
              <input
                className={formStyles.input}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repetí la contraseña"
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
