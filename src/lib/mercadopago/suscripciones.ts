/**
 * Helpers de lógica de negocio para suscripciones.
 * Contiene el cálculo de montos y utilidades que se usan desde API y UI.
 */

// Fallback si `tarifas_precios` está vacío. Debe coincidir con el seed
// de migration 20260418_crear_tarifas_precios.sql.
export const TARIFA_PRECIO_MENSUAL_FALLBACK: Record<number, number> = {
  1: 108_000,
  2: 216_000,
  3: 360_000,
};

export const PRECIO_PARTICULAR_MENSUAL = 5_000;

/**
 * Mapea cantidad de empleados a nivel de tarifa (1, 2 o 3).
 * Misma lógica que la función SQL `calcular_tarifa_por_empleados`.
 */
export function calcularTarifaPorEmpleados(empleados: number | null | undefined): 1 | 2 | 3 {
  const n = Number(empleados || 0);
  if (n <= 30) return 1;
  if (n <= 99) return 2;
  return 3;
}

export function calcularMontoMensual(opts: {
  role: "company" | "provider" | string;
  tarifa?: number | null;
  empleados?: number | null;
  preciosDb?: Record<number, number>;
}): number {
  const precios = opts.preciosDb ?? TARIFA_PRECIO_MENSUAL_FALLBACK;
  if (opts.role === "company") {
    const nivel = opts.tarifa ?? calcularTarifaPorEmpleados(opts.empleados);
    return precios[nivel] ?? TARIFA_PRECIO_MENSUAL_FALLBACK[nivel];
  }
  return PRECIO_PARTICULAR_MENSUAL;
}

export function nombrePlan(role: string, tarifa?: number | null): string {
  if (role === "company") {
    return tarifa ? `UIAB Conecta — Tarifa ${tarifa}` : "UIAB Conecta — Empresa";
  }
  return "UIAB Conecta — Particular";
}

/** Suma 1 mes a un ISO/timestamp manteniendo hora UTC. */
export function sumarUnMes(desde: Date = new Date()): Date {
  const d = new Date(desde);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

/** Estados que permiten acceso al dashboard. */
export const ESTADOS_CON_ACCESO = ["activa", "pendiente_pago", "en_mora"] as const;

export function tieneAcceso(
  estado: string | null | undefined,
  graciaHasta: string | Date | null | undefined
): boolean {
  if (!estado) return false;
  if (estado === "activa" || estado === "pendiente_pago") return true;
  if (estado === "en_mora") {
    if (!graciaHasta) return true;
    return new Date(graciaHasta) > new Date();
  }
  return false;
}
