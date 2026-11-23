export type AccountType =
  | 'corriente'
  | 'ahorro'
  | 'credito'
  | 'efectivo'
  | 'digital'
  | 'inversion'
  | 'financiera'
  | 'aparte'
  | 'prestamo';

export interface Bank {
  id: string;
  nombre: string;
  /** Índice (0-7) dentro de la paleta de gráficos activa — el color real se resuelve en render según el tema elegido. */
  colorIndex: number;
  tipo: AccountType;
  saldoInicial: number;
  icono: string;
  /** Solo tarjetas de crédito: cupo total. El disponible se calcula como límite − deuda − apartados. */
  limiteCredito?: number | null;
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
  /** Id compartido por todas las cuotas de una misma compra, si se registró en cuotas. */
  cuotaGrupoId?: string | null;
  /** Número de esta cuota dentro del grupo (1-based). */
  cuotaNumero?: number | null;
  /** Cantidad total de cuotas del grupo. */
  cuotaTotalCuotas?: number | null;
  /** Id compartido por las dos transacciones (salida/entrada) de una transferencia entre cuentas. */
  transferId?: string | null;
  /**
   * Parte de este gasto que se descontó de un apartado. Se guarda para poder devolverla al apartado
   * si el movimiento se edita o se elimina (así el dinero apartado nunca "desaparece").
   */
  apartado?: AllocationConsumption | null;
  /** Si es un ajuste creado al conciliar un corte, el id de ese corte. No cuenta como ingreso/gasto real. */
  ajusteCorteId?: string | null;
}

export interface AllocationConsumption {
  allocationId: string;
  nombre: string;
  monto: number;
  categoryId?: string | null;
  recurrente?: boolean;
  montoObjetivo?: number | null;
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
  /** Ciclo ("YYYY-MM") al que corresponde el `monto` actual de este apartado. */
  cicloClave?: string | null;
  /** true si al llegar un mes nuevo el apartado debe reponerse solo a `montoObjetivo`. */
  recurrente?: boolean;
  /** Monto al que se repone este apartado en cada ciclo nuevo, si es recurrente. */
  montoObjetivo?: number | null;
  /**
   * Categoría existente a la que pertenece el apartado: los gastos de esa categoría (o de sus
   * subcategorías) en esta cuenta se descuentan de aquí, y al "pagarlo" el gasto queda en ella.
   */
  categoryId?: string | null;
}

export interface CutAccount {
  bankId: string;
  nombre: string;
  /** Saldo de la cuenta al cierre del período anterior (o saldo inicial si es el primer corte). */
  saldoInicioPeriodo: number;
  ingresos: number;
  gastos: number;
  /** Saldo calculado por la app a la fecha del corte, antes de ajustar. */
  saldoSistema: number;
  /** Saldo real informado por el usuario (el que muestra el banco). */
  saldoReal: number;
  /** saldoReal − saldoSistema. Si no es 0 se registró un movimiento de ajuste. */
  ajuste: number;
}

/** Corte de cuentas: cierra un período y deja una foto de los saldos, opcionalmente conciliados. */
export interface Cut {
  id: string;
  /** Fecha de cierre (YYYY-MM-DD), incluida en el período. */
  fecha: string;
  /** Fecha del corte anterior (excluida). null si es el primero. */
  desde: string | null;
  creadoEn: string;
  nombre: string;
  nota: string;
  cuentas: CutAccount[];
  totales: { ingresos: number; gastos: number; neto: number; ajustes: number };
  /** Movimientos de ajuste creados al conciliar; se borran si se elimina el corte. */
  ajusteTxIds: string[];
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

export type AccentColor =
  | 'dorado'
  | 'verde'
  | 'morado'
  | 'rosa'
  | 'azul'
  | 'rojo'
  | 'naranja'
  | 'ambar'
  | 'lima'
  | 'turquesa'
  | 'cian'
  | 'indigo'
  | 'grafito';

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
  /** true cuando el usuario terminó u omitió el tutorial guiado. */
  tutorialVisto?: boolean;
  /** true si el usuario ocultó la tarjeta de "Primeros pasos" del Resumen. */
  primerosPasosOcultos?: boolean;
}

export interface AppData {
  banks: Bank[];
  categories: Category[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  recurringPayments: RecurringPayment[];
  allocations: Allocation[];
  /** Puede faltar en respaldos exportados antes de existir los cortes. */
  cuts?: Cut[];
  dismissedAlertIds: string[];
  settings: AppSettings;
}
