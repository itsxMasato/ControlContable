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
};

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
  if (typeof colorIndex === 'number' && Number.isFinite(colorIndex)) {
    return palette[((colorIndex % palette.length) + palette.length) % palette.length];
  }
  let hash = 0;
  for (let i = 0; i < fallbackId.length; i++) hash = (hash * 31 + fallbackId.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}
