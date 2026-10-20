import { cache } from 'react'
import { createClient } from './servidor'
import { resolverEntidadDePerfil } from '@/modulos/autenticacion/entidad-del-perfil'

/**
 * Lecturas de la sesión que comparten el layout raíz y las páginas dentro de
 * UN mismo render.
 *
 * ANTES cada uno resolvía todo por su cuenta y en serie. Con sesión, el panel
 * hacía dos cadenas en paralelo que pedían lo mismo —getUser → perfiles →
 * miembros_empresa— y el layout encima esperaba 5 viajes seguidos a Supabase
 * antes de mandar el primer byte de HTML. Con `cache()` de React la primera
 * llamada dispara la query y las demás del mismo request reciben la misma
 * promesa.
 *
 * POR QUÉ `getClaims()` Y NO `getUser()`
 *
 * Los JWT del proyecto se firman con ES256 (clave asimétrica, verificado el
 * 2026-10-20 contra /auth/v1/.well-known/jwks.json). Con eso `getClaims()`
 * verifica la firma y el vencimiento en el servidor, con la JWKS cacheada a
 * nivel de módulo, sin ir a Supabase Auth: un viaje menos por render. Lo que
 * NO detecta es una sesión revocada antes de vencer (≤ 1 h). No hace falta acá
 * porque el middleware ya llama a `getUser()` —con red— en cada request y es
 * el que decide el acceso a las rutas privadas; estas lecturas son para
 * renderizar. Las RLS siguen validando el JWT en Postgres igual que antes.
 *
 * Sin `import "server-only"` a propósito: en Turbopack eso rompe la
 * hidratación en silencio si un client component lo importa de rebote. Este
 * módulo sólo lo importan Server Components.
 */

export interface SesionServidor {
  id: string
  email: string | null
}

export const obtenerSesion = cache(async (): Promise<SesionServidor | null> => {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getClaims()
    const claims = data?.claims
    if (error || !claims?.sub) return null
    return { id: claims.sub, email: typeof claims.email === 'string' ? claims.email : null }
  } catch {
    return null
  }
})

/** Columnas que necesitan el layout raíz y el panel, juntas en una sola query. */
const SELECT_PERFIL_SESION = 'id, nombre_completo, rol_sistema, activo, email, tutoriales_vistos, creado_en'

export interface PerfilSesion {
  id: string
  nombre_completo: string | null
  rol_sistema: string | null
  activo: boolean | null
  email: string | null
  tutoriales_vistos: Record<string, string | null> | null
  creado_en: string | null
}

export const obtenerPerfilSesion = cache(async (perfilId: string): Promise<PerfilSesion | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('perfiles')
    .select(SELECT_PERFIL_SESION)
    .eq('id', perfilId)
    .maybeSingle()
  return (data as PerfilSesion | null) ?? null
})

/** La ficha del perfil, por membresía (ver entidad-del-perfil.ts). */
export const obtenerEntidadSesion = cache(async (perfilId: string) => {
  const supabase = await createClient()
  return resolverEntidadDePerfil(supabase, perfilId)
})
