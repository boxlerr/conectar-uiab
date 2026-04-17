import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/servidor'

/**
 * Logout server-side. Con @supabase/ssr la sesión vive en cookies httpOnly
 * que SOLO el servidor puede borrar. El cliente browser no tiene acceso,
 * por eso `supabase.auth.signOut()` desde el browser NO cerraba realmente
 * la sesión — el middleware seguía viendo cookies válidas y "re-loggeaba".
 *
 * Esta ruta:
 *  1. signOut en el cliente de servidor → borra cookies via setAll callback
 *  2. Además limpia manualmente cualquier cookie `sb-*` residual
 *  3. Devuelve 200 al front
 */
export async function POST() {
  console.log('[logout] POST /api/auth/logout — iniciando')

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut({ scope: 'global' })

    if (error) {
      // No abortamos: aunque el roundtrip a Supabase falle, las cookies locales
      // pueden haberse limpiado igual via el callback setAll. Seguimos adelante.
      console.warn('[logout] signOut server error (seguimos limpiando):', error.message)
    } else {
      console.log('[logout] signOut server OK')
    }

    const response = NextResponse.json({ ok: true })

    // Defensa en profundidad: borrar explícitamente cualquier cookie Supabase
    // que haya quedado (por si signOut no limpió todas).
    // @supabase/ssr usa nombres tipo `sb-<project-ref>-auth-token` (puede haber chunks: `.0`, `.1`).
    const allCookies = (await import('next/headers')).cookies
    const store = await allCookies()
    for (const cookie of store.getAll()) {
      if (cookie.name.startsWith('sb-')) {
        response.cookies.set(cookie.name, '', {
          maxAge: 0,
          path: '/',
        })
        console.log('[logout] cookie borrada:', cookie.name)
      }
    }

    return response
  } catch (err) {
    console.error('[logout] fatal error:', err)
    // Aún así devolvemos 200 para que el cliente pueda redirigir.
    // Si las cookies quedaron intactas, el middleware las tratará en la próxima request.
    return NextResponse.json({ ok: false, error: String(err) }, { status: 200 })
  }
}
