import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/** Rutas que exigen sesión. Debe seguir a `isProtectedRoute` de updateSession. */
function esRutaProtegida(pathname: string) {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/empresa/') ||
    pathname.startsWith('/proveedor/') ||
    pathname.startsWith('/perfil') ||
    pathname.startsWith('/panel-de-control') ||
    pathname.startsWith('/pendiente-aprobacion')
  )
}

/**
 * Tope DURO: pase lo que pase adentro, el middleware contesta antes de esto.
 *
 * Vercel mata la invocación del middleware a los 25s y devuelve
 * MIDDLEWARE_INVOCATION_TIMEOUT — un 504 crudo, sin pasar por el catch de abajo,
 * o sea sin el degradado que este archivo tiene escrito. Es lo que vieron las
 * socias el 2026-08-15 con el Postgres caído.
 *
 * Los timeouts de las queries no alcanzaban para evitarlo. Aunque cada fetch se
 * aborte, `@supabase/auth-js` reintenta el refresh del token por su cuenta con
 * backoff exponencial (200, 400, 800, 1600… ms) durante ~30s: son SIESTAS, no
 * esperas de red, así que ningún timeout de fetch las toca. La única forma de
 * acotar "lo que tarda el middleware" es acotarlo desde afuera.
 *
 * 12s son 30 veces lo que tarda con la base sana. Un pico de latencia normal no
 * lo activa; una caída sí, y en 12s en vez de 25 — con el usuario yendo al login
 * en lugar de a una pantalla de error de la plataforma.
 */
const TOPE_DURO_MS = 12_000

export async function middleware(request: NextRequest) {
  let temporizador: ReturnType<typeof setTimeout> | undefined

  try {
    // `Promise.race` no cancela a la perdedora: si gana el reloj, `updateSession`
    // sigue corriendo hasta que la instancia se recicle. No importa —la respuesta
    // ya salió— pero el `clearTimeout` del finally sí importa: un timer pendiente
    // mantiene vivo el event loop y demoraría el retorno de la función.
    return await Promise.race([
      updateSession(request),
      new Promise<never>((_, rechazar) => {
        temporizador = setTimeout(
          () => rechazar(new Error(`el middleware no contestó en ${TOPE_DURO_MS}ms`)),
          TOPE_DURO_MS
        )
      }),
    ])
  } catch (e) {
    // Acá se llega por tres caminos: Supabase no contestó a tiempo (el timeout
    // de fetch-con-timeout.ts), se agotó el presupuesto compartido de la cadena
    // de queries, o venció el TOPE_DURO_MS de arriba. Los tres son la misma
    // situación para el usuario, y se resuelven igual.
    //
    // Fallamos CERRADO en lo privado y ABIERTO en lo público: mandar al login es
    // molesto pero recuperable; dejar pasar una ruta privada sin validar sesión,
    // no. Lo público (landing, directorio, fichas) no depende de esta validación,
    // así que se sirve igual y el usuario ni se entera del hipo.
    console.error('[middleware] no se pudo validar la sesión:', e)

    if (esRutaProtegida(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
  } finally {
    clearTimeout(temporizador)
  }
}

export const config = {
  matcher: [
    /*
     * Todo menos:
     * - _next/static, _next/image, favicon.ico e imágenes (assets)
     * - robots.txt, sitemap.xml, manifest.webmanifest y el archivo de
     *   verificación de Search Console (google*.html)
     *
     * Los archivos de rastreo estaban entrando al middleware, o sea que cada
     * lectura de Googlebot disparaba un `getUser()` contra Supabase antes de
     * devolver un XML que no depende de ninguna sesión: latencia de más
     * justo en las respuestas con las que Google mide qué tan rápido responde
     * el sitio, y un punto de falla extra si Supabase tarda.
     */
    '/((?!_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|google[0-9a-f]+\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
