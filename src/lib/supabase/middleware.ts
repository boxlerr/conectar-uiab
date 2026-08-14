import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { rutaExigeSuscripcion, tieneAcceso } from '@/lib/suscripciones/modelo'
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
    // El perfil se lee con reintento porque de esta query cuelga TODO el gating
    // de abajo, y cuando falla no devuelve "no sos admin": devuelve nada.
    //
    // Pasó el 2026-08-14 a las 9:51 con el admin real: la query a `perfiles`
    // timeouteó a los 8s (`fetch-con-timeout`), `perfil` volvió null, `rol`
    // quedó undefined y el middleware lo mandó a /403 — una pantalla que le
    // decía que no tenía privilegios. Y como cada recarga volvía a fallar,
    // quedó rebotando ahí. Un blip de red no puede leerse como "te degradamos
    // el rol".
    let perfil: {
      rol_sistema?: string | null;
      activo?: boolean | null;
      debe_completar_cuenta?: boolean | null;
    } | null = null;
    let perfilError: unknown = null;

    for (let intento = 0; intento < 2; intento++) {
      const r = await supabase
        .from('perfiles')
        .select('rol_sistema, activo, debe_completar_cuenta')
        .eq('id', user.id)
        .maybeSingle();
      perfil = r.data;
      perfilError = r.error;
      // Sin error, la respuesta es buena aunque venga vacía (usuario sin perfil).
      if (!perfilError) break;
      console.error('[middleware] no se pudo leer el perfil, reintento', intento + 1, perfilError);
    }

    // No es lo mismo "el perfil dice que no sos admin" que "no pudimos leer el
    // perfil". Lo primero es una decisión; lo segundo, una falla nuestra.
    const perfilIlegible = Boolean(perfilError);

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

    // 2.a Primer ingreso con clave provisoria.
    //
    // A quien la UIAB da de alta se le pasa una clave por mensaje: compartida,
    // predecible y, en el caso de las cuentas de administración, la llave del
    // panel entero. Mientras no elija una propia y diga cómo se llama, no se lo
    // deja ir a ningún lado. Va acá, en el middleware, y no como un cartel en la
    // página: un cartel se cierra, y las páginas de /admin ya mandaron sus datos
    // para cuando el navegador lo dibuja.
    if (perfil?.debe_completar_cuenta && !perfilIlegible) {
      const permitido =
        pathname === '/completar-cuenta' ||
        pathname.startsWith('/api/auth/') ||
        pathname === '/login';
      if (!permitido) {
        if (isApiRoute) {
          return responderJson(
            { error: 'Tenés que terminar de activar tu cuenta.' },
            { status: 403 }
          );
        }
        const url = request.nextUrl.clone();
        url.pathname = '/completar-cuenta';
        url.search = '';
        return redirigir(url);
      }
    }

    // 2.b Corte de /admin por ROL, del lado del servidor.
    //
    // `admin/layout.tsx` es un client component: cuando el rol no es admin pinta
    // "Acceso Restringido" y listo. Pero las páginas de adentro son Server
    // Components que consultan con `service_role`, así que para cuando ese cartel
    // se dibuja el servidor YA renderizó y mandó los datos. Medido el 2026-08-13
    // con una socia común: `GET /admin/usuarios` le devolvió 182 KB con el correo
    // de todos los usuarios de la plataforma, su último ingreso y su estado de
    // Auth. El cartel tapaba, en el browser, algo que ya había viajado.
    //
    // El middleware es el único lugar que corta ANTES de renderizar, y cubre de
    // una todas las rutas y sus payloads RSC.
    //
    // Con el perfil ilegible se corta igual —nunca se sirve /admin sin haber
    // confirmado el rol— pero se avisa cuál de los dos casos fue, así el admin
    // no se come un cartel de "no tenés permisos" por un timeout.
    if (pathname.startsWith('/admin') && (perfilIlegible || rol !== 'admin')) {
      if (isApiRoute) {
        return responderJson(
          {
            error: perfilIlegible
              ? 'No pudimos verificar tu sesión. Probá de nuevo.'
              : 'Solo para administradores',
          },
          { status: perfilIlegible ? 503 : 403 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = '/403';
      url.search = '';
      if (perfilIlegible) url.searchParams.set('motivo', 'sin-verificar');
      return redirigir(url);
    }

    // Sin filtrar por `es_principal`: el estado es de la EMPRESA, no del
    // miembro. Ahora que una socia puede darle acceso a su gente, filtrar por
    // titular dejaba a esos usuarios sin membresía visible y el gate los
    // mandaba a /pendiente-aprobacion aunque la empresa estuviera aprobada.
    //
    // El gate de aprobación, en cambio, con el perfil ilegible se deja pasar:
    // no protege datos ajenos (para eso están las RLS y los guards de los
    // actions), sólo elige a qué pantalla mandarte. Rebotar a una socia al día
    // hasta /pendiente-aprobacion por un timeout es peor que dejarla seguir.
    if (perfilIlegible) {
      // isApproved queda en true.
    } else if (rol === 'company') {
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
    pathname.startsWith('/api/suscripcion/');

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

  // 3. Subscription gate: bloquea las rutas pagantes si la suscripción no está
  // activa.
  //
  // Hasta el 2026-08-13 el dashboard y /perfil quedaban afuera del gate: la idea
  // era mostrarlos con un banner y el contenido difuminado. Nunca funcionó —
  // `DashboardBlurGate` es un `return <>{children}</>` y /perfil no mira la
  // suscripción en ninguna línea. O sea que quien se registraba y no pagaba
  // entraba igual: editaba su ficha pública, cargaba catálogo, contestaba la
  // bandeja de entrada, daba de alta usuarios y hasta le arrancaba el tutorial de
  // onboarding. Es lo que pasó con Transporte Gav, que además ni siquiera tenía
  // que estar pagando. Se tapa entero hasta que haya pasarela de pago de verdad.
  //
  // Excepciones a propósito:
  //  - /perfil/suscripcion y todo /suscripcion: es DONDE se paga. Bloquearlas
  //    dejaría a la gente encerrada sin forma de salir del bloqueo.
  //  - /pendiente-aprobacion: quien todavía no fue aprobado tiene que poder leer
  //    en qué estado está.
  //
  // El directorio público (/directorio, /empresas, /proveedores) NO se bloquea:
  // se ve sin cuenta y también para socios sin suscripción — pagás para aparecer,
  // no para mirar.
  const gatedRoute = Boolean(user) && !userError && rutaExigeSuscripcion(pathname);

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
