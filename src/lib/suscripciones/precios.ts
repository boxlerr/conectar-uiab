import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { PRECIOS_POR_DEFECTO, type Precios } from "./modelo";

/**
 * El precio vigente de la suscripción, leído de la base.
 *
 * Antes había dos fuentes que no se hablaban: la tabla `tarifas_precios`, que el
 * admin editaba desde el panel, y las constantes del código, que eran las que
 * efectivamente se cobraban. Subir el precio en el panel no cambiaba nada — una
 * perilla desconectada. Ahora hay una sola clave en `configuraciones_sistema`.
 * La leen el panel, lo que se anota para cobrar (/api/suscripcion/solicitar) y
 * el alta (register-sync: la fila inicial y el mail de "Completá tu
 * suscripción").
 *
 * OJO: las pantallas que MUESTRAN el precio —la home, /register, el checkout y
 * /perfil/suscripcion— todavía usan las constantes de ./modelo. Son componentes
 * de cliente y un cambio en el panel no les llega.
 *
 * Si la lectura falla se devuelven los valores por defecto en vez de romper:
 * una página pública no puede quedarse en blanco porque no se pudo leer una
 * configuración. El desfasaje posible es de un aumento sin aplicar, no de un
 * cobro equivocado — quien cobra de verdad es el admin al registrar el pago.
 */

export const CLAVE_PRECIOS = "precios_suscripcion";

function sanear(valor: unknown): Precios | null {
  if (!valor || typeof valor !== "object") return null;
  const v = valor as Record<string, unknown>;
  const mensual = Number(v.mensual);
  const anual = Number(v.anual);
  if (!Number.isFinite(mensual) || mensual <= 0) return null;
  if (!Number.isFinite(anual) || anual <= 0) return null;
  return { mensual: Math.round(mensual), anual: Math.round(anual) };
}

export async function leerPrecios(): Promise<Precios> {
  try {
    const { data, error } = await createAdminClient()
      .from("configuraciones_sistema")
      .select("valor")
      .eq("clave", CLAVE_PRECIOS)
      .maybeSingle();

    if (error) {
      console.error("[precios] no se pudo leer la configuración:", error.message);
      return PRECIOS_POR_DEFECTO;
    }
    return sanear(data?.valor) ?? PRECIOS_POR_DEFECTO;
  } catch (err) {
    console.error("[precios] error leyendo la configuración:", err);
    return PRECIOS_POR_DEFECTO;
  }
}

/** Valida lo que manda el admin antes de guardarlo. `null` si está bien. */
export function validarPrecios(mensual: number, anual: number): string | null {
  if (!Number.isFinite(mensual) || mensual <= 0) return "El precio mensual tiene que ser un número mayor a cero.";
  if (!Number.isFinite(anual) || anual <= 0) return "El precio anual tiene que ser un número mayor a cero.";
  if (anual > mensual * 12) {
    return "El plan anual sale más caro que pagar 12 meses sueltos. Revisá los números.";
  }
  return null;
}
