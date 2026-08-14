export type AccountType = 'corriente' | 'ahorro' | 'credito' | 'efectivo';

export interface Bank {
  id: string;
  nombre: string;
  /** Índice (0-7) dentro de la paleta de gráficos activa — el color real se resuelve en render según el tema elegido. */
  colorIndex: number;
  tipo: AccountType;
  saldoInicial: number;
  icono: string;
}

export interface Category {
  id: string;
  nombre: string;
  icono: string;
  /** Índice (0-7) dentro de la paleta de gráficos activa — el color real se resuelve en render según el tema elegido. */
  colorIndex: number;
  parentId: string | null;
  presupuestoMensual: number | null;
}

export type TransactionType = 'ingreso' | 'gasto';

export interface Transaction {
  id: string;
  fecha: string; // ISO date YYYY-MM-DD
  bankId: string;
  categoryId: string;
  nota: string;
  monto: number; // siempre positivo, el signo lo da `tipo`
  tipo: TransactionType;
}

export interface Contribution {
  id: string;
  fecha: string;
  monto: number;
  nota: string;
  /** Transacción de gasto generada automáticamente al aportar, si la meta tiene cuenta asociada. */
  transactionId: string | null;
}

export interface SavingsGoal {
  id: string;
  nombre: string;
  icono: string;
  /** Índice (0-7) dentro de la paleta de gráficos activa — el color real se resuelve en render según el tema elegido. */
  colorIndex: number;
  montoObjetivo: number;
  fechaObjetivo: string | null;
  contributions: Contribution[];
  /** Cuenta de la que se descuenta cada aporte. */
  bankId: string;
}

export interface RecurringPayment {
  id: string;
  nombre: string;
  monto: number;
  bankId: string;
  categoryId: string;
  diaDeVencimiento: number; // 1-28
  /** true si lo creó el sistema al detectar un patrón repetido, no el usuario. */
  autoDetectado?: boolean;
}

export interface Allocation {
  id: string;
  bankId: string;
  nombre: string;
  monto: number;
  nota: string;
  /** Si no es null, este apartado lo genera y gestiona automáticamente el pago recurrente indicado. */
  recurringPaymentId?: string | null;
  /** Ciclo (mes, "YYYY-MM") de vencimiento que cubre este apartado automático. */
  cicloClave?: string | null;
}

export type AlertSeverity = 'info' | 'advertencia' | 'logro';

export type AlertType =
  | 'presupuesto_excedido'
  | 'pago_proximo'
  | 'meta_alcanzada'
  | 'gasto_inusual';

export interface AppAlert {
  id: string;
  tipo: AlertType;
  severidad: AlertSeverity;
  titulo: string;
  descripcion: string;
  fecha: string;
  entidadId: string; // id de la categoría, meta o pago relacionado
  accionLabel?: string;
  accionRuta?: string;
}

export type Currency = 'MXN' | 'USD' | 'ARS' | 'COP' | 'PEN' | 'EUR' | 'HNL';

export type AccentColor = 'dorado' | 'verde' | 'morado' | 'rosa' | 'azul';

export type AIProvider = 'openai' | 'claude' | 'gemini';

export interface AISettings {
  proveedor: AIProvider | null;
  apiKey: string;
}

export interface AppSettings {
  moneda: Currency;
  temaOscuro: boolean;
  colorAcento: AccentColor;
  ia: AISettings;
}

export interface AppData {
  banks: Bank[];
  categories: Category[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  recurringPayments: RecurringPayment[];
  allocations: Allocation[];
  dismissedAlertIds: string[];
  settings: AppSettings;
}
