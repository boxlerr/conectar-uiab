import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
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
