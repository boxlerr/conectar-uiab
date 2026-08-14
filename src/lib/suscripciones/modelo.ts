/**
 * La lógica de negocio de la suscripción. Módulo puro: no habla con la base.
 *
 * MODELO ÚNICO: una sola suscripción, **$50.000 por mes** o **$500.000 por año**,
 * igual para empresas y para particulares. El anual es pagar 10 meses y llevarse
 * 12 — el ahorro es exactamente 2 meses, y eso lo calcula `mesesGratis()` en vez
 * de estar escrito a mano en cada pantalla.
 *
 * No hay escalonado por cantidad de empleados: se eliminó el 2026-08-14.
 *
 * Las socias UIAB (`empresas.es_socia_uiab`) no pagan: su suscripción es
 * `activa` con monto 0 y método `cortesia`.
 *
 * Los montos de acá son la RED, no la verdad: el precio vigente vive en la base
 * (`configuraciones_sistema → precios_suscripcion`) y se lee con `leerPrecios()`
 * de ./precios. Estos valores se usan cuando esa lectura falla y en los pocos
 * lugares que no pueden esperar a una query.
 */

export const PRECIO_MENSUAL = 50_000;
export const PRECIO_ANUAL = 500_000;

export type CicloSuscripcion = "mensual" | "anual";

/** El par de precios vigente. */
export type Precios = { mensual: number; anual: number };

export const PRECIOS_POR_DEFECTO: Precios = {
  mensual: PRECIO_MENSUAL,
  anual: PRECIO_ANUAL,
};

/** Monto según el ciclo elegido. */
export function montoPorCiclo(
  ciclo: CicloSuscripcion,
  precios: Precios = PRECIOS_POR_DEFECTO
): number {
  return ciclo === "anual" ? precios.anual : precios.mensual;
}

/** Lo que se ahorra pagando el año de una. */
export function ahorroAnual(precios: Precios = PRECIOS_POR_DEFECTO): number {
  return precios.mensual * 12 - precios.anual;
}

/**
 * El ahorro expresado en meses, que es como se comunica ("te ahorrás 2 meses").
 * Sale de la cuenta y no de un número escrito a mano: si mañana cambian los
 * precios, el copy sigue diciendo la verdad.
 */
export function mesesGratis(precios: Precios = PRECIOS_POR_DEFECTO): number {
  if (precios.mensual <= 0) return 0;
  return Math.round(ahorroAnual(precios) / precios.mensual);
}

/** El anual llevado a $/mes, para poder compararlo con el mensual. */
export function equivalenteMensual(precios: Precios = PRECIOS_POR_DEFECTO): number {
  return Math.round(precios.anual / 12);
}

/**
 * Cuánto aporta por mes una suscripción, sin importar en qué ciclo esté.
 *
 * `suscripciones.monto` guarda el monto DEL CICLO: un anual tiene 500.000 ahí.
 * Sumarlo como si fuera mensual infla la métrica en 10x, que es lo que hacía el
 * panel de admin.
 */
export function aporteMensual(
  monto: number | string | null | undefined,
  ciclo: string | null | undefined
): number {
  const n = Number(monto) || 0;
  return ciclo === "anual" ? n / 12 : n;
}

/** Lo mismo, proyectado a un año. */
export function aporteAnual(
  monto: number | string | null | undefined,
  ciclo: string | null | undefined
): number {
  const n = Number(monto) || 0;
  return ciclo === "anual" ? n : n * 12;
}

/**
 * Monto de la suscripción. Es plano, no depende del rol ni de los empleados.
 * La firma acepta los args viejos para no romper llamadas existentes.
 */
export function calcularMontoMensual(opts?: {
  role?: string;
  tarifa?: number | null;
  empleados?: number | null;
  precios?: Precios;
}): number {
  return opts?.precios?.mensual ?? PRECIO_MENSUAL;
}

/** Nombre del plan que se muestra en la suscripción y en los comprobantes. */
export function nombrePlan(ciclo: CicloSuscripcion = "mensual"): string {
  return ciclo === "anual" ? "UIAB Conecta — Anual" : "UIAB Conecta — Mensual";
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

/**
 * ¿Esta ruta exige suscripción al día?
 *
 * Vive acá y no adentro del middleware para poder probarla sola: es la lista que
 * decide qué se puede usar sin pagar, y hasta el 2026-08-13 dejaba afuera a
 * /perfil y al panel — o sea, casi todo lo que una empresa hace en la plataforma.
 *
 * Las excepciones no son un detalle: /suscripcion y /perfil/suscripcion son
 * justamente donde se paga. Si entraran al gate, quien no pagó quedaría encerrado
 * sin forma de salir.
 */
export function rutaExigeSuscripcion(pathname: string): boolean {
  if (pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/suscripcion")) return false;
  if (pathname.startsWith("/perfil/suscripcion")) return false;

  return (
    pathname.startsWith("/oportunidades") ||
    pathname.startsWith("/empresa/") ||
    pathname.startsWith("/proveedor/") ||
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/panel-de-control")
  );
}
