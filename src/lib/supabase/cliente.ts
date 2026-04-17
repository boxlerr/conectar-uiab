import { createBrowserClient } from '@supabase/ssr'

type BrowserClient = ReturnType<typeof createBrowserClient>

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CLIENTE SUPABASE BROWSER — con anti-deadlock
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * BUG QUE ESTO ARREGLA:
 *   Después de navegar un rato (o de tener la tab en background), las páginas
 *   de `/empresas`, `/oportunidades` y `/directorio` quedaban colgadas en
 *   skeleton infinito. Ni F5 lo arreglaba. Solo cerrar la ventana.
 *
 * CAUSA RAÍZ:
 *   `@supabase/ssr` usa internamente `navigator.locks.request('lock:sb-...-auth-token')`
 *   para serializar el refresh de token entre tabs. Si ese lock queda huérfano
 *   (HMR en dev, tab backgrounded, un refresh que falla a medias, un bfcache
 *   que no libera el lock al restaurar), TODAS las queries posteriores del
 *   cliente esperan para siempre por el lock. Como el singleton del módulo
 *   persiste entre re-renders, F5 no ayuda: es la misma instancia con la
 *   misma cola de locks muertos.
 *
 * FIX en 3 capas:
 *   1. Custom `lock` con timeout: si no podemos adquirir el lock en 3s,
 *      lo saltamos y corremos la operación igual. Mejor corromper un refresh
 *      que colgar toda la UI.
 *   2. `resetClient()` expuesto para forzar cliente fresco desde el contexto
 *      de auth (visibilitychange, health-check failure).
 *   3. Auto-reset en `visibilitychange` cuando la tab vuelve a primer plano
 *      tras >30s (cubre "dejé la tab de fondo y al volver no cargaba nada").
 */

let client: BrowserClient | undefined
let lastVisibleAt = Date.now()

/**
 * Lock con timeout. Firma compatible con la opción `auth.lock` de
 * @supabase/supabase-js. Si `navigator.locks` existe, lo usamos normalmente
 * pero con AbortSignal que corta a los 3s. Si el lock no se adquiere (porque
 * otro holder quedó colgado) lanzamos y dejamos que el caller siga sin lock —
 * Supabase ya tiene un fallback interno para este caso.
 */
async function lockConTimeout<R>(
  name: string,
  acquireTimeoutMs: number,
  fn: () => Promise<R>
): Promise<R> {
  // En SSR no hay navigator.locks — ejecutar directo.
  if (typeof navigator === 'undefined' || !('locks' in navigator) || !navigator.locks) {
    return fn()
  }

  // Timeout agresivo: si el lock no se adquiere en ${acquireTimeoutMs || 3000}ms,
  // saltamos el lock. Esto NO corrompe datos: los operations que usan el lock
  // son idempotentes (refresh de token, lectura de sesión).
  const timeout = Math.min(acquireTimeoutMs || 3000, 3000)
  const abortCtrl = new AbortController()
  const timer = setTimeout(() => abortCtrl.abort(), timeout)

  try {
    return await navigator.locks.request(
      name,
      { mode: 'exclusive', signal: abortCtrl.signal },
      async () => fn()
    )
  } catch (err: any) {
    // AbortError = lock huérfano. Corremos sin lock.
    if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
      console.warn(`[supabase] Lock "${name}" no se adquirió en ${timeout}ms — corriendo sin lock (probable lock huérfano)`)
      return fn()
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Fetch con timeout de 15s. Se inyecta en el cliente Supabase (global.fetch),
 * así CADA query HTTP que haga la librería queda protegida automáticamente
 * sin tener que envolver cada llamada en cada página.
 *
 * Cuando una query se cuelga (lock huérfano de navigator.locks, red caída,
 * token zombie), en vez de dejar la UI en skeleton infinito, rechazamos el
 * fetch a los 15s, reciclamos el cliente (resetClient) y el caller recibe
 * el error — la página puede mostrar estado de error en vez de cargar para
 * siempre.
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
    console.error(`[supabase] fetch TIMEOUT 15s en ${label} — abortando y reciclando cliente`)
    resetClient()
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
        // Override del lock default de @supabase/supabase-js — si un lock
        // (navigator.locks) queda huérfano, saltamos y seguimos.
        lock: lockConTimeout as any,
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
    // Instalar el watcher una única vez por tab.
    if (typeof window !== 'undefined') {
      installVisibilityWatcher()
    }
  }
  return client
}

/**
 * Fuerza un cliente Supabase fresco en el próximo `createClient()`.
 * Llamarlo desde:
 *   - El contexto de auth cuando el health-check falla 2x
 *   - `visibilitychange` cuando la tab estuvo backgrounded >30s
 *   - Error handlers de queries que timeouteen
 */
export function resetClient(): void {
  if (client) {
    console.warn('[supabase] resetClient() — reciclando cliente browser para romper deadlock')
  }
  client = undefined
}

function installVisibilityWatcher() {
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      const gap = Date.now() - lastVisibleAt
      // Si la tab estuvo >30s en background, el lock de auth-token pudo
      // quedar huérfano. Reciclar el cliente es defensivo y barato.
      if (gap > 30_000) {
        console.log(`[supabase] Tab regresó tras ${Math.round(gap / 1000)}s en background — reciclando cliente`)
        resetClient()
      }
      lastVisibleAt = Date.now()
    } else {
      lastVisibleAt = Date.now()
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange)
}
