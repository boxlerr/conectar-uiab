import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname;

  const isApiRoute = pathname.startsWith('/api/');
  // Landing pages de los directorios (/directorio, /empresas, /proveedores,
  // /instituciones-educativas, /instituciones-bancarias, /oportunidades) son
  // públicas. El gating de la búsqueda/listado lo hace el cliente según auth.
  // Los detalles (/empresa/[id], /proveedor/[id]) y áreas privadas siguen
  // protegidas.
  const isProtectedRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/empresa/') ||
    pathname.startsWith('/proveedor/') ||
    pathname.startsWith('/perfil') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/pendiente-aprobacion');

  // 1. Authentication Check (Require JWT)
  if (isProtectedRoute && (!user || userError)) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // 2. Approval gate: non-admin authenticated users must be approved to access
  //    most protected routes. Unapproved users are redirected to the "pending"
  //    page, and can only reach /perfil, /pendiente-aprobacion and auth APIs.
  let isApproved = true;
  if (user && !userError) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol_sistema')
      .eq('id', user.id)
      .maybeSingle();

    const rol = perfil?.rol_sistema;

    if (rol === 'company') {
      const { data: m } = await supabase
        .from('miembros_empresa')
        .select('empresas(estado)')
        .eq('perfil_id', user.id)
        .eq('es_principal', true)
        .maybeSingle();
      const estado = (m as { empresas?: { estado?: string } } | null)?.empresas?.estado;
      isApproved = estado === 'aprobada' || estado === 'activo';
    } else if (rol === 'provider') {
      const { data: m } = await supabase
        .from('miembros_proveedor')
        .select('proveedores(estado)')
        .eq('perfil_id', user.id)
        .eq('es_principal', true)
        .maybeSingle();
      const estado = (m as { proveedores?: { estado?: string } } | null)?.proveedores?.estado;
      isApproved = estado === 'aprobado' || estado === 'activo';
    }
    // admin / guest / null → pasan sin gating
  }

  const isPendingAllowedPath =
    pathname === '/pendiente-aprobacion' ||
    pathname.startsWith('/perfil') ||
    pathname.startsWith('/api/auth/');

  if (user && !userError && !isApproved && isProtectedRoute && !isPendingAllowedPath) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Cuenta pendiente de aprobación' }, { status: 403 });
    }
    const url = request.nextUrl.clone()
    url.pathname = '/pendiente-aprobacion'
    return NextResponse.redirect(url)
  }

  // 3. Redirect logged in users away from auth pages and root landing
  if (user && !userError && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = isApproved ? '/dashboard' : '/pendiente-aprobacion'
    return NextResponse.redirect(url)
  }

  // Check for admin routes explicitly handled by Next Layer Guards now.

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
