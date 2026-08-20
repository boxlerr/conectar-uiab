import "server-only";

import type { CicloSuscripcion } from "@/lib/suscripciones/modelo";

/**
 * Los planes recurrentes de Sipago.
 *
 * Son los que se crean a mano en el portal (Suscripciones → Crear plan) y viven
 * en `subscriptions.sipago.coop/checkout/<uuid>`. A diferencia del Checkout de
 * la API de Cobros —que cobra una vez y avisa por webhook— acá el socio deja la
 * tarjeta adherida y Sipago le debita todos los meses solo.
 *
 * EL PRECIO ESTÁ EN DOS LADOS. El del plan lo fija el portal; el de la
 * plataforma sale de `configuraciones_sistema`. Sipago no expone una API para
 * leer el plan, así que no hay forma de verificar desde acá que coincidan: si
 * alguien cambia el precio en el panel de la UIAB tiene que cambiarlo también en
 * el portal, y viceversa. `avisoDeDesfasaje()` es lo único que podemos hacer:
 * decírselo al admin en la pantalla donde cambia el precio.
 */

/** La URL del plan para un ciclo, o null si no hay plan configurado. */
export function urlPlan(ciclo: CicloSuscripcion): string | null {
  const valor =
    ciclo === "anual"
      ? process.env.SIPAGO_PLAN_ANUAL_URL
      : process.env.SIPAGO_PLAN_MENSUAL_URL;

  // Sólo https: el link se le muestra al socio y termina en un `location.href`.
  if (!valor || !valor.startsWith("https://")) return null;
  return valor;
}

/** ¿Este ciclo se cobra con débito automático? */
export function hayPlanRecurrente(ciclo: CicloSuscripcion): boolean {
  return urlPlan(ciclo) !== null;
}

// ─── La fecha de cobro del plan anual ───────────────────────────────────────

/**
 * El plan anual de Sipago cobra en un mes y día FIJOS del calendario, iguales
 * para todos los suscriptores. No existe la opción "aniversario": al crear el
 * plan, `Mes de cobro` y `Día de cobro` son obligatorios, y después no se
 * pueden editar (el diálogo de edición sólo expone nombre, monto y redirección).
 *
 * O sea que alguien que se adhiere el 20 de agosto NO renueva el 20 de agosto:
 * renueva en la fecha del plan. Lo que evita que eso sea un robo es el
 * **prorrateo**, que Sipago aplica al primer cobro: se le cobra sólo la parte
 * del año que va desde que se adhiere hasta la fecha común.
 *
 * Estas constantes tienen que coincidir con lo cargado en el portal. No hay API
 * para leerlo, así que se replican acá y se usan para dos cosas: decirle al
 * socio cuánto va a pagar de verdad, y que la conciliación no lea ese primer
 * cobro prorrateado como un error.
 */
export const DIA_COBRO_ANUAL = Number(process.env.SIPAGO_PLAN_ANUAL_DIA ?? 10);
export const MES_COBRO_ANUAL = Number(process.env.SIPAGO_PLAN_ANUAL_MES ?? 1);

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "10 de enero", para el copy. */
export function fechaCobroAnualEnPalabras(): string {
  return `${DIA_COBRO_ANUAL} de ${MESES[MES_COBRO_ANUAL - 1] ?? "enero"}`;
}

/** La próxima vez que cae la fecha de cobro anual, contando desde `desde`. */
export function proximaFechaCobroAnual(desde: Date = new Date()): Date {
  const f = new Date(Date.UTC(desde.getUTCFullYear(), MES_COBRO_ANUAL - 1, DIA_COBRO_ANUAL));
  if (f <= desde) f.setUTCFullYear(f.getUTCFullYear() + 1);
  return f;
}

/**
 * Cuánto va a salir el PRIMER cobro de un anual que se adhiere hoy.
 *
 * Es una estimación: la fórmula exacta de prorrateo la aplica Sipago y no está
 * documentada. Sirve para no mentirle al socio en el checkout —que hoy le dice
 * "$500.000" y le van a cobrar otra cosa— y para que la conciliación sepa en qué
 * orden de magnitud esperar ese cobro.
 */
export function primerCobroAnualEstimado(precioAnual: number, desde: Date = new Date()): number {
  const proxima = proximaFechaCobroAnual(desde);
  const dias = Math.max(1, Math.round((proxima.getTime() - desde.getTime()) / 86_400_000));
  return Math.round(precioAnual * (Math.min(dias, 365) / 365));
}

/**
 * El aviso que ve el admin cuando toca el precio.
 *
 * Cambiar el precio acá no cambia el del plan de Sipago, y un socio que ya está
 * adherido va a seguir pagando el viejo hasta que alguien edite el plan en el
 * portal. Es la clase de desfasaje que nadie nota durante meses.
 */
export function avisoDeDesfasaje(ciclo: CicloSuscripcion): string | null {
  const url = urlPlan(ciclo);
  if (!url) return null;
  return (
    "Ojo: el plan recurrente de Sipago tiene su propio precio y no se actualiza solo. " +
    "Si cambiás el monto acá, cambialo también en portal.sipago.coop → Suscripciones."
  );
}
