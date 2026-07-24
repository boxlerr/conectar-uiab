import { createBrowserClient } from '@supabase/ssr'

type BrowserClient = ReturnType<typeof createBrowserClient>

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CLIENTE SUPABASE BROWSER — un único cliente por tab, imposible de colgar
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * HISTORIA (dos bugs distintos — no repetirlos):
 *
 * BUG 1 — skeleton infinito por locks huérfanos:
 *   `@supabase/ssr` usa `navigator.locks.request('lock:sb-...-auth-token')`
 *   para serializar el refresh de token entre tabs. Un lock huérfano (HMR,
 *   bfcache, tab backgrounded) dejaba TODAS las queries esperando para
 *   siempre; ni F5 lo arreglaba porque el singleton persiste.
 *   FIX: `lockNoOp` (sin locks — un refresh duplicado es inofensivo) +
 *   `fetchConTimeout` (toda query HTTP aborta a los 15s). Con esas dos capas,
 *   ninguna query puede quedar pendiente infinitamente.
 *
 * BUG 2 — el perfil quedaba "cargando" tras volver de background o navegar:
 *   La vieja capa 3 reciclaba el cliente (resetClient) al volver de background
 *   >30s o ante un timeout. Pero las páginas retienen el cliente viejo vía
 *   useMemo/closures, así que quedaban DOS clientes vivos refrescando el
 *   mismo token. Supabase rota los refresh tokens: cuando dos instancias usan
 *   el mismo, detecta reuso y revoca la familia entera → todas las queries
 *   siguientes fallan y la UI queda en spinner hasta re-loguear.
 *   FIX: el cliente es un singleton que NUNCA se recicla. `resetClient()`
 *   quedó como no-op para los call-sites viejos.
 */

let client: BrowserClient | undefined

/**
 * Lock NO-OP. Reemplaza el lock default de @supabase/supabase-js que usa
 * `navigator.locks.request('lock:sb-*-auth-token')` y puede colgarse
 * indefinidamente si un holder queda huérfano (HMR, tab backgrounded, bfcache).
 *
 * Por qué es seguro:
 *   El lock existe para evitar que múltiples tabs refresquen el token a la
 *   vez. Sin el lock, el peor caso es un refresh duplicado — la API de Supabase
 *   maneja eso bien (retorna el mismo refresh token dentro de la ventana de
 *   reuso). Una colisión rara es aceptable vs la UI colgada para siempre.
 */
const lockNoOp = async <R>(
  _name: string,
  _acquireTimeoutMs: number,
  fn: () => Promise<R>
): Promise<R> => {
  return fn()
}

/**
 * Fetch con timeout de 15s. Se inyecta en el cliente Supabase (global.fetch),
 * así CADA query HTTP que haga la librería queda protegida automáticamente
 * sin tener que envolver cada llamada en cada página.
 *
 * Cuando una query se cuelga (red caída, token zombie), en vez de dejar la
 * UI en skeleton infinito rechazamos el fetch a los 15s y el caller recibe
 * el error — por eso todo loader de página debe tener try/finally para
 * apagar su spinner.
 */
function fetchConTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()

  // Si el caller ya trae un signal, lo respetamos encadenando.
  if (init?.signal) {
    if (init.signal.aborted) controller.abort(init.signal.reason)
    else init.signal.addEventListener('abort', () => controller.abort(init.signal!.reason))
  }

  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  const label = url.split('/rest/v1/').pop()?.split('?')[0] || url.split('/auth/v1/').pop()?.split('?')[0] || 'query'

  const timer = setTimeout(() => {
    console.error(`[supabase] fetch TIMEOUT 15s en ${label} — abortando`)
    controller.abort(new DOMException('Supabase fetch timeout', 'TimeoutError'))
  }, 15_000)

  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

function build(): BrowserClient {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        // Reemplazamos el lock default (navigator.locks) con un no-op para
        // eliminar toda posibilidad de deadlock por locks huérfanos.
        lock: lockNoOp as any,
      },
      global: {
        // Cualquier query REST/auth/storage pasa por acá. Timeout universal
        // de 15s: cubre todos los archivos nuevos (directorio, solicitudes,
        // etiquetas, perfil, instituciones, oportunidades/[id], etc.) sin
        // tener que envolver cada uno a mano.
        fetch: fetchConTimeout,
      },
    }
  )
}

export function createClient(): BrowserClient {
  if (!client) {
    client = build()
  }
  return client
}

/**
 * NO-OP deliberado (ver BUG 2 en el encabezado). Reciclar el cliente dejaba
 * dos instancias vivas refrescando el mismo token → Supabase revocaba la
 * familia de refresh tokens y la sesión "moría sola" (perfil en spinner
 * eterno). El deadlock que este reset intentaba curar ya es imposible gracias
 * a lockNoOp + fetchConTimeout. Se mantiene la función exportada porque hay
 * call-sites en caminos de error que la invocan; llamarla es inofensivo.
 */
export function resetClient(): void {}
