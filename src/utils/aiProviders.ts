import type { AIProvider } from '../types';

/** Modelo usado automáticamente según el proveedor elegido — no es configurable por el usuario. */
export const AI_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-5.6-luna',
  claude: 'claude-sonnet-5',
  gemini: 'gemini-3.6-flash',
};

export const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: 'ChatGPT (OpenAI)',
  claude: 'Claude (Anthropic)',
  gemini: 'Gemini (Google)',
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message ?? body?.message ?? `Error HTTP ${res.status}`;
  } catch {
    return `Error HTTP ${res.status}`;
  }
}

async function askOpenAI(apiKey: string, model: string, systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI no devolvió una respuesta con texto.');
  return text;
}

async function askClaude(apiKey: string, model: string, systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const json = await res.json();
  const text = json?.content?.[0]?.text;
  if (!text) throw new Error('Claude no devolvió una respuesta con texto.');
  return text;
}

async function askGemini(apiKey: string, model: string, systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
      }),
    }
  );
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini no devolvió una respuesta con texto.');
  return text;
}

export async function askAI(
  provider: AIProvider,
  apiKey: string,
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  if (!apiKey.trim()) throw new Error('Falta configurar tu clave de API en Configuración.');
  const model = AI_MODELS[provider];
  switch (provider) {
    case 'openai':
      return askOpenAI(apiKey, model, systemPrompt, messages);
    case 'claude':
      return askClaude(apiKey, model, systemPrompt, messages);
    case 'gemini':
      return askGemini(apiKey, model, systemPrompt, messages);
  }
}
