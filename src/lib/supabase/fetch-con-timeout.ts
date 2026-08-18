/**
 * Timeout para las queries de Supabase del lado SERVIDOR.
 *
 * `cliente.ts` ya inyectaba un `fetch` con timeout de 15s en el cliente browser,
 * pero ni `servidor.ts` ni el cliente del middleware tenían nada equivalente: una
 * query colgada dejaba el render RSC esperando hasta el tope de la función de
 * Vercel (300s). Para el usuario eso es indistinguible de un cuelgue eterno, y
 * encima es INVISIBLE en una navegación client-side: el router de Next se queda
 * con el `loading.tsx` puesto, sin error y sin timeout propio.
 *
 * El corte es más agresivo que en el browser (8s) porque acá el que espera es el
 * render de la página: si a los 8s Supabase no contestó, reintentar sale más
 * barato que seguir esperando.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ ADEMÁS DEL TOPE POR LLAMADA HAY UN `deadline`
 *
 * Un tope por llamada no acota lo que tarda una CADENA de llamadas. El middleware
 * hace hasta cinco seguidas (getUser, perfil con reintento, membresía,
 * suscripción): con 8s cada una eso da 40s, y la plataforma mata la invocación
 * del middleware a los 25s con MIDDLEWARE_INVOCATION_TIMEOUT — un 504 en la cara
 * del socio, sin pasar por ningún catch nuestro. Es exactamente lo que pasó el
 * 2026-08-15 cuando se cayó el Postgres de producción.
 *
 * Con `deadline` (un instante absoluto, compartido por todas las llamadas de un
 * mismo request) cada query espera lo que queda del presupuesto y no más, así la
 * cadena entera cabe en su ventana en vez de sumar topes independientes.
 */

/** Milisegundos que esperamos a Supabase desde el servidor antes de cortar. */
export const TIMEOUT_SERVIDOR_MS = 8_000

/** Etiqueta corta de la URL, para que el log diga qué query se cortó. */
function etiquetaDe(input: RequestInfo | URL): string {
  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  return (
    url.split('/rest/v1/').pop()?.split('?')[0] ||
    url.split('/auth/v1/').pop()?.split('?')[0] ||
    'query'
  )
}

export interface OpcionesFetchConTimeout {
  /** Tope por llamada. Por defecto, TIMEOUT_SERVIDOR_MS. */
  timeoutMs?: number
  /**
   * Instante absoluto (`Date.now()` + presupuesto) más allá del cual ninguna
   * llamada de esta cadena debe seguir esperando. Cada fetch usa lo que sea
   * MENOR entre `timeoutMs` y lo que quede hasta acá.
   */
  deadline?: number
}

/**
 * Fabrica un `fetch` que se aborta solo. Se le pasa a supabase-js por
 * `global.fetch` al construir el cliente.
 */
export function crearFetchConTimeout(opciones: OpcionesFetchConTimeout = {}) {
  const { timeoutMs = TIMEOUT_SERVIDOR_MS, deadline } = opciones

  return function fetchConTimeout(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const etiqueta = etiquetaDe(input)

    // Lo que queda del presupuesto compartido, si hay uno.
    const restante = deadline != null ? deadline - Date.now() : Infinity
    const espera = Math.min(timeoutMs, restante)

    // Presupuesto agotado: no tiene sentido ni abrir la conexión. Devolvemos el
    // mismo error que un timeout para que el caller no distinga dos casos que
    // para él son el mismo ("Supabase no contestó a tiempo").
    if (espera <= 0) {
      console.error(`[supabase/servidor] presupuesto agotado antes de ${etiqueta} — no se intenta`)
      return Promise.reject(
        new DOMException('Supabase server fetch budget exhausted', 'TimeoutError')
      )
    }

    const controller = new AbortController()

    // Si el caller ya trae su propio signal, lo encadenamos en vez de pisarlo.
    if (init?.signal) {
      if (init.signal.aborted) controller.abort(init.signal.reason)
      else init.signal.addEventListener('abort', () => controller.abort(init.signal!.reason))
    }

    const timer = setTimeout(() => {
      console.error(`[supabase/servidor] TIMEOUT ${espera}ms en ${etiqueta} — abortando`)
      controller.abort(new DOMException('Supabase server fetch timeout', 'TimeoutError'))
    }, espera)

    return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
  }
}

/**
 * El de siempre: tope de 8s por llamada, sin presupuesto compartido.
 *
 * Sirve para los contextos donde el techo es el de la función de Vercel (300s) y
 * no hay un tope de plataforma más chico: Server Components, Server Actions y
 * rutas de API. El middleware NO usa este — arma el suyo con `deadline`.
 */
export const fetchConTimeoutServidor = crearFetchConTimeout()
