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
