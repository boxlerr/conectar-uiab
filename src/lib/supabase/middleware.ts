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
  const isProtectedRoute = 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/directorio') || 
    pathname.startsWith('/empresa/') || 
    pathname.startsWith('/perfil') || 
    pathname.startsWith('/proveedor/') ||
    pathname.startsWith('/dashboard');

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

  // 2. Redirect logged in users away from auth pages and root landing to dashboard
  if (user && !userError && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // 3. Subscription gate: bloquea rutas pagantes si la suscripción no está activa.
  // Excluidas: /perfil/suscripcion (donde el usuario ve/paga), /suscripcion/*, /api/*,
  // admin (tiene su propio guard), auth pages, y usuarios con rol admin.
  const gatedRoute =
    user && !userError &&
    !isApiRoute &&
    !pathname.startsWith('/perfil/suscripcion') &&
    !pathname.startsWith('/suscripcion') &&
    !pathname.startsWith('/admin') &&
    (pathname.startsWith('/dashboard') || pathname.startsWith('/perfil') || pathname.startsWith('/empresa/') || pathname.startsWith('/proveedor/'));

  if (gatedRoute) {
    // Obtener rol + entityId
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol_sistema')
      .eq('id', user!.id)
      .maybeSingle();

    if (perfil && perfil.rol_sistema !== 'admin' && perfil.rol_sistema !== 'guest') {
      const tabla = perfil.rol_sistema === 'company' ? 'miembros_empresa' : 'miembros_proveedor';
      const fk = perfil.rol_sistema === 'company' ? 'empresa_id' : 'proveedor_id';
      const { data: m } = await supabase.from(tabla).select(fk).eq('perfil_id', user!.id).maybeSingle();
      const entityId = (m as any)?.[fk];

      if (entityId) {
        const { data: sus } = await supabase
          .from('suscripciones')
          .select('estado, gracia_hasta')
          .eq(fk, entityId)
          .order('creado_en', { ascending: false })
          .limit(1)
          .maybeSingle();

        const estado = sus?.estado;
        const gracia = sus?.gracia_hasta ? new Date(sus.gracia_hasta) : null;
        const ahora = new Date();

        const bloqueado =
          !estado ||
          estado === 'suspendida' ||
          estado === 'cancelada' ||
          (estado === 'en_mora' && gracia && gracia < ahora);

        if (bloqueado) {
          const url = request.nextUrl.clone();
          url.pathname = '/suscripcion/bloqueado';
          url.searchParams.set('from', pathname);
          return NextResponse.redirect(url);
        }
      }
    }
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
