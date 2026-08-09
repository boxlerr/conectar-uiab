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

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request)
  } catch (e) {
    // Acá sólo se llega si Supabase no contestó a tiempo (el timeout de
    // fetch-con-timeout.ts) o si se cayó la red. Antes esto no podía pasar
    // porque no había timeout: la request quedaba colgada hasta el tope de la
    // función y la navegación client-side se congelaba sin error visible.
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
