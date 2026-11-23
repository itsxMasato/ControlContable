import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  BarChart3,
  CloudCheck,
  Hand,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  Plus,
  ShieldCheck,
  Tags,
  Target,
  Wallet,
} from 'lucide-react';

export interface TourStep {
  /** Ruta a la que hay que ir antes de mostrar el paso. */
  route: string;
  /** Selector del elemento a resaltar. Si no existe o no está visible, el paso se muestra centrado. */
  target?: string;
  icon: LucideIcon;
  title: string;
  body: string;
  /** Consejo extra, en una caja aparte. */
  tip?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    route: '/',
    icon: Hand,
    title: 'Bienvenido a tu Libro de Gastos',
    body: 'En unos pasos te mostramos cómo llevar tus cuentas, gastos, apartados y metas. Lo podés repetir cuando quieras desde Configuración.',
  },
  {
    route: '/',
    target: '[data-tour="hero"]',
    icon: LayoutDashboard,
    title: 'Tu saldo de un vistazo',
    body: 'Acá ves cuánto dinero tenés entre todas tus cuentas, lo que gastaste este mes y lo ahorrado. Si tenés tarjetas o préstamos, se muestra tu patrimonio neto: lo que tenés menos lo que debés.',
  },
  {
    route: '/',
    target: '[data-tour="account"]',
    icon: Wallet,
    title: 'Filtrá por cuenta',
    body: 'Elegí una cuenta para ver solo sus números en el Resumen. Con "Todas las cuentas" ves el total consolidado.',
  },
  {
    route: '/',
    target: '[data-tour="new-tx"]',
    icon: Plus,
    title: 'Registrá cada movimiento',
    body: 'Con este botón anotás gastos e ingresos: monto, cuenta, categoría y una nota. También podés dividir una compra en cuotas.',
    tip: 'Anotá los gastos el mismo día. Si cargás algo repetido (mismo monto, cuenta y día), la app te avisa.',
  },
  {
    route: '/bancos',
    target: '[data-tour="banks-add"]',
    icon: Landmark,
    title: 'Primero, tus cuentas',
    body: 'Agregá cada lugar donde tenés dinero: banco, efectivo, billetera digital, financiera, inversión o un fondo aparte. Las tarjetas de crédito y los préstamos se cargan como deuda, con su límite.',
    tip: 'Poné el saldo real de hoy como saldo inicial: así todo lo demás cuadra con tu banco.',
  },
  {
    route: '/bancos',
    target: '[data-tour="allocations"]',
    icon: PiggyBank,
    title: 'Apartados: dinero con destino',
    body: 'Un apartado reserva parte del saldo para algo concreto (renta, tarjeta, supermercado). Vinculalo a una categoría y tus gastos de esa categoría se descuentan solos de ahí. El "Disponible" es tu saldo menos lo apartado.',
    tip: 'Si borrás o editás un gasto que salió de un apartado, el dinero vuelve al apartado automáticamente.',
  },
  {
    route: '/categorias',
    target: '[data-tour="categories-add"]',
    icon: Tags,
    title: 'Categorías y presupuestos',
    body: 'Organizá tus gastos en categorías y subcategorías, cada una con su ícono. Si les ponés un presupuesto mensual, verás cuánto llevás gastado y te avisamos al pasarte.',
  },
  {
    route: '/transacciones',
    target: '[data-tour="tx-search"]',
    icon: ArrowLeftRight,
    title: 'Tus movimientos',
    body: 'Todos tus gastos e ingresos, agrupados por día. Buscá por nota, banco o categoría, filtrá por fechas y tocá cualquiera para editarlo. Las transferencias entre tus cuentas no cuentan como gasto.',
  },
  {
    route: '/ahorros',
    target: '[data-tour="goals-add"]',
    icon: Target,
    title: 'Metas de ahorro',
    body: 'Creá una meta con monto y fecha objetivo. Cada aporte se descuenta de la cuenta elegida y la app te estima cuándo la vas a alcanzar.',
  },
  {
    route: '/',
    target: '[data-tour="analysis"]',
    icon: BarChart3,
    title: 'Reportes, alertas y asistente',
    body: 'En Reportes ves tendencias por mes y año. Las Alertas te avisan de presupuestos excedidos y pagos próximos. El Asistente IA responde preguntas sobre tus finanzas.',
  },
  {
    route: '/',
    target: '[data-tour="sync"]',
    icon: CloudCheck,
    title: 'Tus datos siempre a salvo',
    body: 'Este indicador muestra si todo está respaldado en la nube. Sin internet podés seguir usando la app: los cambios se guardan en el teléfono y se suben solos al volver la conexión.',
  },
  {
    route: '/',
    icon: ShieldCheck,
    title: '¡Listo para empezar!',
    body: 'Te recomendamos este orden: 1) creá tus cuentas, 2) revisá tus categorías, 3) registrá tus movimientos y 4) apartá dinero para tus pagos fijos. En el Resumen tenés una lista de primeros pasos que se marca sola.',
  },
];
