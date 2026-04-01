import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type UserRole = 'admin' | 'company' | 'provider' | 'guest'

/**
 * Helper on the server to retrieve the user's role from the `perfiles` table
 * instead of the JWT claim.
 */
export async function getRole(): Promise<UserRole | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Error when called down in a Server Component without Server Action
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch role from the `perfiles` table
  const { data: profile } = await supabase
    .from('perfiles')
    .select('rol_sistema')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.rol_sistema) {
    return 'guest' // Fallback role
  }

  return profile.rol_sistema as UserRole
}

/**
 * Ensures the user has one of the allowed roles, otherwise redirects to 403 or throws an error (if API).
 */
export async function requireRole(allowedRoles: UserRole[], isApiRoute = false) {
  const role = await getRole()

  if (!role || !allowedRoles.includes(role)) {
    if (isApiRoute) {
      throw new Error('Forbidden: Acceso denegado a esta ruta API')
    }
    redirect('/403')
  }

  return role
}
