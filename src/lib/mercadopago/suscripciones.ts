/**
 * Helpers de lógica de negocio para suscripciones.
 *
 * MODELO ÚNICO (reunión jul-2026): una sola suscripción de **$50.000/mes** o
 * **$500.000/año** (pago anual de una), igual para empresas y particulares.
 * Las socias UIAB actuales (empresas.n_socio not null) NO pagan: tienen acceso
 * de cortesía por ser miembros. Las altas nuevas sí abonan.
 */

export const PRECIO_MENSUAL = 50_000;
export const PRECIO_ANUAL = 500_000;

export type CicloSuscripcion = "mensual" | "anual";

/** Monto según el ciclo elegido. */
export function montoPorCiclo(ciclo: CicloSuscripcion): number {
  return ciclo === "anual" ? PRECIO_ANUAL : PRECIO_MENSUAL;
}

/**
 * Monto de la suscripción. Es plano ($50.000), no depende del rol, empleados ni
 * tarifa. La firma acepta los args viejos para no romper llamadas existentes.
 */
export function calcularMontoMensual(_opts?: {
  role?: string;
  tarifa?: number | null;
  empleados?: number | null;
  preciosDb?: Record<number, number>;
}): number {
  return PRECIO_MENSUAL;
}

/** Nombre de plan mostrado en la suscripción / MercadoPago. */
export function nombrePlan(
  _role?: string,
  _tarifa?: number | null,
  ciclo: CicloSuscripcion = "mensual"
): string {
  return ciclo === "anual" ? "UIAB Conecta — Anual" : "UIAB Conecta";
}

// ── Legacy: se conservan para compatibilidad de imports, pero el precio ya no
// depende de la cantidad de empleados. Todos los niveles valen $50.000.
export const TARIFA_PRECIO_MENSUAL_FALLBACK: Record<number, number> = {
  1: PRECIO_MENSUAL,
  2: PRECIO_MENSUAL,
  3: PRECIO_MENSUAL,
};
export const PRECIO_PARTICULAR_MENSUAL = PRECIO_MENSUAL;

/** @deprecated El precio ya no escala por empleados; queda por compatibilidad. */
export function calcularTarifaPorEmpleados(empleados: number | null | undefined): 1 | 2 | 3 {
  const n = Number(empleados || 0);
  if (n <= 30) return 1;
  if (n <= 99) return 2;
  return 3;
}

/** Suma 1 mes a un ISO/timestamp manteniendo hora UTC. */
export function sumarUnMes(desde: Date = new Date()): Date {
  const d = new Date(desde);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

/** Suma 1 año a un ISO/timestamp manteniendo hora UTC. */
export function sumarUnAnio(desde: Date = new Date()): Date {
  const d = new Date(desde);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d;
}

/** Próximo cobro según el ciclo. */
export function proximoCobro(ciclo: CicloSuscripcion, desde: Date = new Date()): Date {
  return ciclo === "anual" ? sumarUnAnio(desde) : sumarUnMes(desde);
}

/**
 * Estados que habilitan las rutas pagas.
 *
 * `pendiente_pago` NO habilita, y es el cambio que cierra el item 1.2 del
 * reporte de Lucas: toda suscripción nace en ese estado desde register-sync, así
 * que mientras contara como acceso, quien se registraba y nunca pasaba por el
 * checkout usaba la plataforma completa sin abonar el canon. Ahora el alta nueva
 * queda afuera hasta que efectivamente pague.
 *
 * `en_mora` sí habilita mientras corra el período de gracia: ahí ya pagaron
 * alguna vez y lo que hay es un cobro fallido, no un alta sin abonar.
 *
 * Las socias UIAB no se ven afectadas: entran por /sumate → /admin/altas y
 * reciben una suscripción `activa` de cortesía ("Socia UIAB (sin cargo)").
 */
export const ESTADOS_CON_ACCESO = ["activa", "en_mora"] as const;

export function tieneAcceso(
  estado: string | null | undefined,
  graciaHasta: string | Date | null | undefined
): boolean {
  if (!estado) return false;
  if (estado === "activa") return true;
  if (estado === "en_mora") {
    if (!graciaHasta) return true;
    return new Date(graciaHasta) > new Date();
  }
  return false;
}
