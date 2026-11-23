import type { AccentColor } from '../types';

/**
 * Paleta categórica de 8 tonos validada con el script de dataviz (banda de luminosidad,
 * piso de croma, separación CVD adjacente y contraste) contra la superficie real de cada
 * tema, en modo claro y oscuro. El orden rota según el color elegido en Configuración, para
 * que el primer tono del gráfico "complemente" la paleta activa — la familia de 8 tonos y
 * sus pares adyacentes se mantienen siempre validados, solo cambia el punto de partida.
 */
const RING_LIGHT = ['#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948', '#2a78d6'];
const RING_DARK = ['#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767', '#3987e5'];
// orden del anillo: orange, aqua, yellow, magenta, green, violet, red, blue (cíclico)

const START_INDEX: Record<AccentColor, number> = {
  dorado: 0, // orange
  verde: 4, // green
  morado: 5, // violet
  rosa: 3, // magenta
  azul: 7, // blue
  rojo: 6, // red
  naranja: 0, // orange
  ambar: 2, // yellow
  lima: 4, // green
  turquesa: 1, // aqua
  cian: 1, // aqua
  indigo: 5, // violet
  grafito: 7, // blue
};

/**
 * Colores extra fijos (no rotan con el tema), cada uno con variante para modo claro y oscuro.
 * Se guardan como `colorIndex = EXTRA_BASE + i` para no cambiar el esquema de datos.
 */
export const EXTRA_BASE = 100;
export const EXTRA_COLORS: { name: string; light: string; dark: string }[] = [
  { name: 'Rojo', light: '#dc2626', dark: '#f87171' },
  { name: 'Coral', light: '#f05d4f', dark: '#ff8a7a' },
  { name: 'Naranja', light: '#ea580c', dark: '#fb923c' },
  { name: 'Ámbar', light: '#d97706', dark: '#fbbf24' },
  { name: 'Amarillo', light: '#ca8a04', dark: '#facc15' },
  { name: 'Lima', light: '#65a30d', dark: '#a3e635' },
  { name: 'Verde', light: '#16a34a', dark: '#4ade80' },
  { name: 'Esmeralda', light: '#059669', dark: '#34d399' },
  { name: 'Turquesa', light: '#0d9488', dark: '#2dd4bf' },
  { name: 'Cian', light: '#0891b2', dark: '#22d3ee' },
  { name: 'Celeste', light: '#0284c7', dark: '#38bdf8' },
  { name: 'Azul', light: '#2563eb', dark: '#60a5fa' },
  { name: 'Índigo', light: '#4f46e5', dark: '#818cf8' },
  { name: 'Violeta', light: '#7c3aed', dark: '#a78bfa' },
  { name: 'Fucsia', light: '#c026d3', dark: '#e879f9' },
  { name: 'Rosa', light: '#db2777', dark: '#f472b6' },
  { name: 'Café', light: '#92400e', dark: '#d6a372' },
  { name: 'Grafito', light: '#52525b', dark: '#a1a1aa' },
];

/** Color totalmente personalizado: `colorIndex = CUSTOM_BASE + 0xRRGGBB`. */
export const CUSTOM_BASE = 1_000_000_000;

export function encodeCustomColor(hex: string): number {
  return CUSTOM_BASE + parseInt(hex.replace('#', '').slice(0, 6), 16);
}

export function decodeCustomColor(colorIndex: number): string {
  return `#${(colorIndex - CUSTOM_BASE).toString(16).padStart(6, '0')}`;
}

function rotate(ring: string[], start: number): string[] {
  return [...ring.slice(start), ...ring.slice(0, start)];
}

export function getChartPalette(accent: AccentColor, dark: boolean): string[] {
  const start = START_INDEX[accent] ?? 0;
  return rotate(dark ? RING_DARK : RING_LIGHT, start);
}

/**
 * Resuelve el color real de una entidad (categoría, banco, meta) a partir de su
 * `colorIndex` y la paleta activa — así el color sigue al tema en todos los gráficos,
 * no solo en el selector al crearla. Si la entidad no tiene `colorIndex` (datos previos
 * a esta migración), cae a un índice determinístico basado en su id.
 */
export function resolveThemeColor(
  colorIndex: number | undefined,
  fallbackId: string,
  accent: AccentColor,
  dark: boolean
): string {
  const palette = getChartPalette(accent, dark);
  if (typeof colorIndex === 'number' && colorIndex >= CUSTOM_BASE) return decodeCustomColor(colorIndex);
  if (typeof colorIndex === 'number' && colorIndex >= EXTRA_BASE) {
    const extra = EXTRA_COLORS[colorIndex - EXTRA_BASE];
    if (extra) return dark ? extra.dark : extra.light;
  }
  if (typeof colorIndex === 'number' && Number.isFinite(colorIndex)) {
    return palette[((colorIndex % palette.length) + palette.length) % palette.length];
  }
  let hash = 0;
  for (let i = 0; i < fallbackId.length; i++) hash = (hash * 31 + fallbackId.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}
