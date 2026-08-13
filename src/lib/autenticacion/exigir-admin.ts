import { getRole } from "./obtener-rol";

/**
 * Guard de admin para Server Actions.
 *
 * Un Server Action es un endpoint POST más, con su id publicado en el bundle que
 * baja cualquiera: no hay nada que impida invocarlo a mano desde cualquier URL.
 * El corte por rol del middleware mira `pathname.startsWith('/admin')`, o sea que
 * protege el GET de la pantalla, no el POST del action. Y adentro de estas
 * acciones se opera con `service_role`, que se saltea RLS.
 *
 * Vive en un módulo propio —y no adentro de un archivo `"use server"`— porque
 * todo lo que se exporta desde ahí se vuelve un action invocable por red. Un
 * guard expuesto como endpoint sería exactamente lo contrario de un guard.
 *
 * Devuelve el error en vez de redirigir, así el panel lo muestra con un toast.
 */
export async function exigirAdmin(): Promise<{ error: string } | null> {
  const rol = await getRole();
  if (rol !== "admin") {
    return { error: "No tenés permiso para hacer esto." };
  }
  return null;
}
