import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/servidor'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CALLBACK DE AUTENTICACIÓN
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Endpoint único al que apuntan todos los links de correo de Supabase Auth:
 *   - Confirmación de registro  (type=signup)
 *   - Recuperación de contraseña (type=recovery)
 *   - Cambio de email            (type=email_change)
 *   - Invitación                 (type=invite)
 *   - Magic link                 (type=magiclink)
 *
 *  Admite los dos flujos que Supabase genera según la versión de la plantilla:
 *   1. Flujo moderno con `token_hash` + `type` (verifyOtp).
 *   2. Flujo PKCE con `code` (exchangeCodeForSession).
 *
 *  Al finalizar, redirige a `?next=...` si vino en el link, o a una página por
 *  defecto razonable según el `type`. Si algo falla, vuelve al login con un
 *  mensaje en la query.
 */

const DESTINOS_POR_DEFECTO: Record<string, string> = {
  signup: '/confirmar-email',
  recovery: '/restablecer-password',
  email_change: '/perfil',
  invite: '/restablecer-password',
  magiclink: '/dashboard',
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') || 'signup'
  const nextParam = searchParams.get('next')

  const destino = nextParam || DESTINOS_POR_DEFECTO[type] || '/dashboard'
  const supabase = await createClient()

  try {
    if (tokenHash) {
      const { error } = await supabase.auth.verifyOtp({
        // Supabase admite 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change';
        // casteamos porque `type` viene como string libre del query param.
        type: type as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change',
        token_hash: tokenHash,
      })
      if (error) throw error
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
    } else {
      // Sin parámetros válidos — tratamos como link expirado o mal formado.
      return NextResponse.redirect(
        `${origin}/login?error=link_invalido`
      )
    }

    return NextResponse.redirect(`${origin}${destino}`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'link_invalido'
    console.error('[auth/callback] Error verificando link:', msg)
    const razon = encodeURIComponent(msg)
    return NextResponse.redirect(
      `${origin}/login?error=${razon}`
    )
  }
}
