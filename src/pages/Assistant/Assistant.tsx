import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Sparkles } from 'lucide-react';
import styles from './Assistant.module.css';
import { useAppData } from '../../context/AppDataContext';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { askAI, AI_PROVIDER_LABELS, type ChatMessage } from '../../utils/aiProviders';
import { buildFinancialSummary } from '../../utils/financialSummary';

const SUGGESTIONS = [
  'Dame recomendaciones generales para mejorar mis finanzas',
  '¿Dónde puedo recortar gastos este mes?',
  '¿Voy bien con mis metas de ahorro?',
  '¿Qué categorías están fuera de control?',
];

export default function Assistant() {
  const { data } = useAppData();
  const { ia } = data.settings;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const summary = buildFinancialSummary(data);
  const systemPrompt = `Sos un asesor financiero personal cercano y directo. Respondé siempre en español, de forma breve, concreta y accionable. Escribí en texto plano, sin markdown (nada de asteriscos para negrita, ni encabezados con #): usá numeración simple y saltos de línea para organizar la respuesta. A continuación te paso un resumen de la situación financiera actual de la persona que te consulta — usalo como única fuente de datos, no inventes montos ni cuentas que no aparezcan ahí.\n\n${summary}`;

  const send = async (text: string) => {
    if (!text.trim() || !ia.proveedor) return;
    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setLoading(true);
    try {
      const reply = await askAI(ia.proveedor, ia.apiKey, systemPrompt, nextMessages);
      setMessages([...nextMessages, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo obtener respuesta.');
    } finally {
      setLoading(false);
    }
  };

  if (!ia.proveedor) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Asistente IA</h1>
            <p className="page-subtitle">Recomendaciones sobre tus finanzas, con la IA que prefieras</p>
          </div>
        </div>
        <div className="card">
          <EmptyState
            title="Conectá una IA primero"
            subtitle="Configurá tu clave de OpenAI, Claude o Gemini en Configuración para empezar a pedir recomendaciones."
            action={
              <Link to="/configuracion">
                <Button variant="primary">Ir a Configuración</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Asistente IA</h1>
          <p className="page-subtitle">Conectado a {AI_PROVIDER_LABELS[ia.proveedor]}</p>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={`card ${styles.chatCard}`}>
          <div className={styles.messages}>
            {messages.length === 0 ? (
              <EmptyState
                title="Preguntale a tu asistente"
                subtitle="Elegí una sugerencia o escribí tu propia pregunta sobre tus finanzas."
              />
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant}`}>
                  {m.content}
                </div>
              ))
            )}
            {loading && <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>Pensando…</div>}
          </div>

          {error && <div className={styles.summaryText} style={{ color: 'var(--brick)' }}>{error}</div>}

          {messages.length === 0 && (
            <div className={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <button key={s} className={styles.suggestionBtn} onClick={() => send(s)} disabled={loading}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className={styles.inputRow}>
            <textarea
              className={styles.textInput}
              rows={2}
              placeholder="Preguntale algo a tu asistente..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <Button variant="primary" icon={<Send size={16} />} onClick={() => send(input)} disabled={loading || !input.trim()}>
              Enviar
            </Button>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Sparkles size={15} className="text-faint" />
            <span className="section-title" style={{ marginBottom: 0 }}>
              Qué le compartimos
            </span>
          </div>
          <p className="text-faint" style={{ fontSize: 12, marginBottom: 10 }}>
            Este resumen se envía junto con tu pregunta en cada consulta.
          </p>
          <div className={styles.summaryText}>{summary}</div>
        </div>
      </div>
    </div>
  );
}
