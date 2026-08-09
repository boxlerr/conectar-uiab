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
 */

/** Milisegundos que esperamos a Supabase desde el servidor antes de cortar. */
export const TIMEOUT_SERVIDOR_MS = 8_000

export function fetchConTimeoutServidor(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController()

  // Si el caller ya trae su propio signal, lo encadenamos en vez de pisarlo.
  if (init?.signal) {
    if (init.signal.aborted) controller.abort(init.signal.reason)
    else init.signal.addEventListener('abort', () => controller.abort(init.signal!.reason))
  }

  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  const etiqueta =
    url.split('/rest/v1/').pop()?.split('?')[0] ||
    url.split('/auth/v1/').pop()?.split('?')[0] ||
    'query'

  const timer = setTimeout(() => {
    console.error(`[supabase/servidor] TIMEOUT ${TIMEOUT_SERVIDOR_MS}ms en ${etiqueta} — abortando`)
    controller.abort(new DOMException('Supabase server fetch timeout', 'TimeoutError'))
  }, TIMEOUT_SERVIDOR_MS)

  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}
