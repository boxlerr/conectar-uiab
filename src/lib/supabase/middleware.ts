import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { tieneAcceso } from '@/lib/mercadopago/suscripciones'
import { fetchConTimeoutServidor } from './fetch-con-timeout'

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
      // El middleware corre en TODA navegación, incluidos los fetch RSC y los
      // prefetch de <Link>. Sin timeout, una query lenta cuelga la navegación
      // entera sin que el usuario vea ningún error — ver fetch-con-timeout.ts.
      global: { fetch: fetchConTimeoutServidor },
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

  /**
   * Redirige SIN PERDER LAS COOKIES que Supabase acaba de escribir.
   *
   * `NextResponse.redirect()` crea una respuesta nueva y vacía. Si `getUser()`
   * rotó el token, las cookies nuevas quedaron en `supabaseResponse` — y al
   * devolver el redirect pelado se tiraban. El browser se quedaba con el refresh
   * token VIEJO, que Supabase ya invalidó al rotarlo: a partir de ahí todas las
   * llamadas fallan y la sesión "se muere sola" a mitad de navegación.
   *
   * Es exactamente el caso contra el que advierte el comentario del final de
   * este archivo, y que los 5 redirects de acá abajo no respetaban.
   */
  const redirigir = (url: URL) => {
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => res.cookies.set(cookie))
    return res
  }

  /** Misma idea que `redirigir`, para las respuestas JSON de las rutas /api. */
  const responderJson = (body: unknown, init: { status: number }) => {
    const res = NextResponse.json(body, init)
    supabaseResponse.cookies.getAll().forEach((cookie) => res.cookies.set(cookie))
    return res
  }

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
    pathname.startsWith('/panel-de-control') ||
    pathname.startsWith('/pendiente-aprobacion');

  // 1. Authentication Check (Require JWT)
  if (isProtectedRoute && (!user || userError)) {
    if (isApiRoute) {
      return responderJson({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return redirigir(url)
  }

  // 2. Approval gate: non-admin authenticated users must be approved to access
  //    most protected routes. Unapproved users are redirected to the "pending"
  //    page, and can only reach /perfil, /pendiente-aprobacion and auth APIs.
  let isApproved = true;
  // Se propaga hasta la regla 3: sin esto, a la cuenta desactivada la mandábamos
  // a /login y la regla 3 la rebotaba a /panel-de-control, de donde volvía a
  // salir a /login — un loop de redirección infinito, del que sólo se salía
  // borrando cookies a mano.
  let cuentaDesactivada = false;
  if (user && !userError) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol_sistema, activo')
      .eq('id', user.id)
      .maybeSingle();

    // Usuario desactivado (por su empresa o por la UIAB): el ban de Auth le
    // frena el login nuevo, pero si tenía la sesión abierta el access token
    // sigue vivo hasta una hora. Este corte lo saca en el próximo request.
    // Va acá y no en una consulta aparte porque es la MISMA query que ya se
    // hacía para el gating por aprobación: no agrega latencia.
    if (perfil && perfil.activo === false) {
      cuentaDesactivada = true;
      // /api/auth/* queda afuera: si le cortamos también el logout, el usuario
      // desactivado se queda con la sesión muerta pegada en el browser y sin
      // forma de limpiarla.
      if (isApiRoute && !pathname.startsWith('/api/auth/')) {
        return responderJson({ error: 'Cuenta desactivada' }, { status: 403 });
      }
      if (pathname !== '/login') {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.search = ''
        url.searchParams.set('cuenta', 'desactivada')
        return redirigir(url)
      }
    }

    const rol = perfil?.rol_sistema;

    // Sin filtrar por `es_principal`: el estado es de la EMPRESA, no del
    // miembro. Ahora que una socia puede darle acceso a su gente, filtrar por
    // titular dejaba a esos usuarios sin membresía visible y el gate los
    // mandaba a /pendiente-aprobacion aunque la empresa estuviera aprobada.
    if (rol === 'company') {
      const { data: m } = await supabase
        .from('miembros_empresa')
        .select('empresas(estado)')
        .eq('perfil_id', user.id)
        .limit(1)
        .maybeSingle();
      const estado = (m as { empresas?: { estado?: string } } | null)?.empresas?.estado;
      isApproved = estado === 'aprobada' || estado === 'activo';
    } else if (rol === 'provider') {
      const { data: m } = await supabase
        .from('miembros_proveedor')
        .select('proveedores(estado)')
        .eq('perfil_id', user.id)
        .limit(1)
        .maybeSingle();
      const estado = (m as { proveedores?: { estado?: string } } | null)?.proveedores?.estado;
      isApproved = estado === 'aprobado' || estado === 'activo';
    }
    // admin / guest / null → pasan sin gating
  }

  const isPendingAllowedPath =
    pathname === '/pendiente-aprobacion' ||
    pathname.startsWith('/perfil') ||
    pathname.startsWith('/suscripcion') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/mercadopago/');

  if (user && !userError && !isApproved && isProtectedRoute && !isPendingAllowedPath) {
    if (isApiRoute) {
      return responderJson({ error: 'Cuenta pendiente de aprobación' }, { status: 403 });
    }
    const url = request.nextUrl.clone()
    url.pathname = '/pendiente-aprobacion'
    return redirigir(url)
  }

  // 3. Redirect logged in users away from auth pages and root landing.
  //    `!cuentaDesactivada` es lo que corta el loop: a esa cuenta el bloque de
  //    arriba la dejó justamente en /login para que lea el aviso, así que acá no
  //    hay que volver a sacarla.
  if (user && !userError && !cuentaDesactivada && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = isApproved ? '/panel-de-control' : '/pendiente-aprobacion'
    return redirigir(url)
  }

  // 3. Subscription gate: bloquea rutas pagantes si la suscripción no está activa.
  // Dashboard y /perfil son accesibles (el dashboard muestra un banner con blur).
  // El directorio público (/directorio, /empresas, /proveedores) NO se bloquea:
  // se ve sin cuenta y también para socios sin suscripción — pagás para aparecer,
  // no para mirar. Siguen bloqueados: oportunidades y las vistas internas de
  // empresa/proveedor dentro del dashboard.
  const gatedRoute =
    user && !userError &&
    !isApiRoute &&
    !pathname.startsWith('/suscripcion') &&
    !pathname.startsWith('/admin') &&
    (
      pathname.startsWith('/oportunidades') ||
      pathname.startsWith('/empresa/') ||
      pathname.startsWith('/proveedor/')
    );

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

        // Una sola fuente de verdad para "¿puede entrar?": antes esto era una
        // expresión propia acá y `tieneAcceso` vivía sin usarse en
        // lib/mercadopago/suscripciones, con criterios distintos.
        if (!tieneAcceso(sus?.estado, sus?.gracia_hasta)) {
          const url = request.nextUrl.clone();
          url.pathname = '/suscripcion/bloqueado';
          url.searchParams.set('from', pathname);
          return redirigir(url);
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
