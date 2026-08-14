export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function monthKey(dateISO: string): string {
  return dateISO.slice(0, 7); // YYYY-MM
}

export function addMonths(monthKeyStr: string, delta: number): string {
  const [y, m] = monthKeyStr.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(monthKeyStr: string): string {
  const [y, m] = monthKeyStr.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('es', { month: 'short', year: '2-digit' });
}

export function monthLabelLong(monthKeyStr: string): string {
  const [y, m] = monthKeyStr.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  const label = d.toLocaleDateString('es', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function lastNMonthKeys(n: number, fromMonthKey = monthKey(todayISO())): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addMonths(fromMonthKey, -i));
  return out;
}

export function formatDateShort(dateISO: string): string {
  const d = new Date(dateISO + 'T00:00:00');
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Semana ISO: lunes a domingo. Devuelve clave "YYYY-Www"
export function isoWeekKey(dateISO: string): string {
  const d = new Date(dateISO + 'T00:00:00');
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target.valueOf() - firstThursday.valueOf();
  const week = 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
  return `${target.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function startOfWeek(dateISO: string): string {
  const d = new Date(dateISO + 'T00:00:00');
  const dayNr = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayNr);
  return d.toISOString().slice(0, 10);
}

export function daysUntil(dateISO: string): number {
  const today = new Date(todayISO() + 'T00:00:00');
  const target = new Date(dateISO + 'T00:00:00');
  return Math.round((target.valueOf() - today.valueOf()) / (24 * 60 * 60 * 1000));
}

export function nextOccurrenceOfDay(day: number): string {
  const now = new Date();
  const candidate = new Date(now.getFullYear(), now.getMonth(), day);
  if (candidate < new Date(now.toDateString())) {
    candidate.setMonth(candidate.getMonth() + 1);
  }
  return candidate.toISOString().slice(0, 10);
}
