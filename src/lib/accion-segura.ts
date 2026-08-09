/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LLAMAR SERVER ACTIONS SIN QUE LA APP SE CUELGUE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * EL BUG QUE ESTO ARREGLA (el "queda cargando en loop hasta que aprieto F5"):
 *
 * Las queries del cliente Supabase NUNCA rechazan: devuelven `{ data, error }`,
 * y además `cliente.ts` les inyecta un timeout de 15s. Los Server Actions son
 * el camino opuesto y quedaron sin ninguna red:
 *
 *   - Su promesa RECHAZA cuando falla el transporte (no devuelve `{ error }`).
 *   - No pasan por el `fetch` del cliente Supabase, así que el timeout de 15s
 *     no los cubre. Los manda el runtime de Next, no nosotros.
 *
 * Un `await accion()` que rechaza sin try/catch aborta la función ahí mismo, y
 * el `setCargando(false)` de la línea siguiente no corre nunca. Según dónde
 * esté la llamada el síntoma cambia, pero la causa es la misma:
 *
 *   - dentro de `useEffect`          → spinner infinito
 *   - dentro de `startTransition`    → el error sube sin dueño y React
 *                                      desmonta el árbol entero
 *                                      ("Application error", pantalla en blanco)
 *
 * CUÁNDO RECHAZA EN LA VIDA REAL — el caso dominante es el DEPLOY SKEW: tras un
 * deploy, las pestañas abiertas siguen con el bundle JS viejo y mandan un
 * `Next-Action` id que ya no existe en el build nuevo. El server responde error
 * y la promesa rechaza. Por eso F5 lo arregla (baja el bundle nuevo) y navegar
 * con <Link> no (la navegación client-side NO recarga el JS: el mismo bundle
 * muerto reenvía el mismo id muerto). Los otros casos son red caída, 500 del
 * action y cortes de conexión.
 *
 * CÓMO SE USA — envolvé la llamada, no la cambies de forma:
 *
 *     const res = await llamarAccion(() => listarUsuariosDeLaFicha());
 *
 * Devuelve lo mismo que el action, o `{ error }` si el transporte falló. Como
 * casi todos los actions ya devuelven `{ error }` en su unión de tipos, el
 * manejo de error que cada componente ya tenía sigue funcionando sin tocarlo.
 */

/**
 * Lo que ve el usuario cuando el transporte falla. Habla de recargar porque el
 * disparador más común (deploy skew) se soluciona exactamente así.
 */
export const ERROR_TRANSPORTE_ACCION =
  "No pudimos completar la operación. Puede que la app se haya actualizado: recargá la página e intentá de nuevo.";

/**
 * Ejecuta un Server Action garantizando que la promesa RESUELVE siempre.
 *
 * Nunca rechaza: si el transporte falla, devuelve `{ error }` como si el propio
 * action hubiera reportado el problema. Eso mantiene vivo el camino de error que
 * ya escribió cada componente y, sobre todo, deja que corra el `setCargando(false)`.
 */
export async function llamarAccion<T>(
  accion: () => Promise<T>
): Promise<T | { error: string }> {
  try {
    return await accion();
  } catch (e) {
    // No es un error de negocio: es la llamada que no llegó o no volvió.
    // Se loguea siempre — es la única huella que queda de un deploy skew.
    console.error("[accion] falló el transporte del Server Action:", e);
    return { error: ERROR_TRANSPORTE_ACCION };
  }
}

/**
 * ¿El resultado de un action es un fallo?
 *
 * Unifica los dos orígenes posibles: el `{ error }` que devuelve el propio
 * action cuando la operación no se pudo hacer, y el `{ error }` que agrega
 * `llamarAccion` cuando la llamada ni siquiera llegó. Al componente le da igual
 * cuál de los dos fue — en ambos casos hay que apagar el spinner y avisar.
 *
 *     const res = await llamarAccion(() => guardar(datos));
 *     if (fallo(res)) return toast.error(res.error);
 *     // acá TypeScript ya sabe que `res` es el caso exitoso
 */
export function fallo(res: unknown): res is { error: string } {
  return (
    typeof res === "object" &&
    res !== null &&
    "error" in res &&
    typeof (res as { error?: unknown }).error === "string"
  );
}
