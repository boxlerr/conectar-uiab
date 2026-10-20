"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/tipos";
import { createClient } from "@/lib/supabase/cliente";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

// ─── Logger condicional ──────────────────────────────────────────────────────
// Activá logs detallados con `localStorage.setItem('auth-debug', '1')` en la
// consola del browser. Útil para diagnosticar el bug "queda cargando" cuando
// ocurre en producción — te deja ver qué hace el listener de Supabase,
// cuándo se refresca el token, y cuándo se dispara el healthcheck.
function dbg(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage.getItem('auth-debug') === '1') {
      console.log('[auth]', new Date().toISOString().slice(11, 23), ...args);
    }
  } catch { /* localStorage bloqueado en incognito raro */ }
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * El usuario que resolvió el servidor para un subárbol (ver `SemillaUsuario`).
 * `undefined` = ese subárbol no tiene semilla.
 */
const SemillaContext = createContext<User | undefined>(undefined);
const AdoptarSemillaContext = createContext<((usuario: User) => void) | null>(null);

/**
 * Copia del último perfil resuelto, para pintar el header al toque en la
 * próxima carga en vez de esperar las tres queries del perfil. Es sólo para
 * DIBUJAR: se usa nada más si la sesión de las cookies es del mismo usuario,
 * se vuelve a validar enseguida contra Supabase y los permisos los decide el
 * servidor (middleware, Server Actions, RLS), nunca esta copia.
 */
const CLAVE_CACHE = "uiab:usuario";

function leerCache(userId: string): User | null {
  try {
    const crudo = window.localStorage.getItem(CLAVE_CACHE);
    if (!crudo) return null;
    const u = JSON.parse(crudo) as User;
    return u?.id === userId ? u : null;
  } catch {
    return null;
  }
}

function escribirCache(usuario: User | null) {
  try {
    if (usuario) window.localStorage.setItem(CLAVE_CACHE, JSON.stringify(usuario));
    else window.localStorage.removeItem(CLAVE_CACHE);
  } catch { /* localStorage bloqueado: sin caché, se resuelve por red */ }
}

interface AuthProviderProps {
  children: ReactNode;
  /**
   * Usuario ya resuelto. El layout raíz NO lo pasa: leer la sesión ahí (cookies)
   * hacía dinámicas las 81 rutas del sitio, y las páginas públicas no podían
   * salir del CDN. Las privadas siembran el suyo con `SemillaUsuario`.
   */
  initialUser?: User | null;
}

/**
 * Sin `initialUser` el provider arranca en estado DESCONOCIDO: `loading: true`
 * y `currentUser: null`. Es el mismo HTML para todos (por eso la página puede
 * ser estática) y se resuelve en el cliente al montar.
 *
 * Contrato para los ~40 consumidores de `useAuth()`: con `loading` en true NO
 * se sabe si hay sesión. No se redirige ni se esconde contenido público en ese
 * estado — lo que va en el HTML es la versión sin sesión, que es la que tiene
 * que ver Google.
 */
export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  // Ya hay usuario resuelto: `initialUser`, o una página privada que sembró el
  // del servidor antes de que montara el provider (los layout effects de los
  // hijos corren antes que el useEffect de abajo). No se vuelve a resolver.
  const initialFetchDone = useRef(!!initialUser);
  // Mientras corre la resolución inicial, el SIGNED_IN que auth-js emite al
  // levantar la sesión de las cookies es el mismo trabajo: se ignora.
  const resolviendoInicial = useRef(false);
  // Ref al currentUser para leer valor actual dentro de listeners sin re-suscribir
  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // La copia local sigue al usuario resuelto. Nunca se borra en el estado
  // desconocido: ahí todavía no se sabe nada.
  useEffect(() => {
    if (loading) return;
    escribirCache(currentUser);
  }, [currentUser, loading]);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  /**
   * Guarda el perfil SÓLO si cambió. Cada `setCurrentUser` con un objeto nuevo
   * —aunque traiga exactamente los mismos datos— cambia el contexto y
   * re-renderiza a todos los que usan `useAuth()` (~40 componentes, el header y
   * la página incluidos). Con el mismo contenido se devuelve el objeto de antes
   * y React no re-renderiza nada.
   */
  const aplicarPerfil = useCallback((perfil: User) => {
    setCurrentUser((actual) =>
      actual && JSON.stringify(actual) === JSON.stringify(perfil) ? actual : perfil
    );
  }, []);

  const fetchProfile = useCallback(async (userId: string, email: string): Promise<User | null> => {
    dbg('fetchProfile:start', userId);
    try {
      // Perfil y membresía en paralelo: las dos dependen sólo del userId, y en
      // serie era un viaje más antes de poder pintar el header.
      const [{ data, error }, { data: memberEmpresa }] = await Promise.all([
        supabase
          .from('perfiles')
          .select('*')
          .eq('id', userId)
          .single(),
        supabase
          .from('miembros_empresa')
          .select('empresa_id, empresas:empresa_id(estado, ruta_logo, bucket_logo)')
          .eq('perfil_id', userId)
          .limit(1)
          .maybeSingle(),
      ]);

      if (error) {
        // PGRST116 = no rows found; expected right after signUp before register-sync creates the row
        if ((error as any).code !== 'PGRST116') {
          console.error("[auth] Error fetching profile:", error);
        }
        return null;
      }

      if (data) {
        let entityId = null;
        let entidadEstado: string | null = null;
        let logoUrl: string | null = null;

        // Helper para resolver la URL pública del logo desde (bucket, ruta).
        const resolverLogoUrl = (bucket?: string | null, ruta?: string | null): string | null => {
          if (!bucket || !ruta) return null;
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(ruta);
          return pub?.publicUrl ?? null;
        };

        // Fetch Business Layer ID mapping + logo de la entidad.
        //
        // La ficha se resuelve por MEMBRESÍA, no por rol: un admin puede ser
        // además dueño de su propia empresa y tiene que poder configurarla.
        // Antes esto colgaba de `rol_sistema === 'company'` y a los admin les
        // dejaba entityId en null (panel vacío, /perfil rebotado a /admin).
        let entityRole: 'company' | 'provider' | null = null;

        if (memberEmpresa?.empresa_id) {
          entityRole = 'company';
          entityId = memberEmpresa.empresa_id;
          const ent = (memberEmpresa as any)?.empresas;
          entidadEstado = ent?.estado ?? null;
          logoUrl = resolverLogoUrl(ent?.bucket_logo, ent?.ruta_logo);
        } else {
          const { data: memberProveedor } = await supabase
            .from('miembros_proveedor')
            .select('proveedor_id, proveedores:proveedor_id(estado, ruta_logo, bucket_logo)')
            .eq('perfil_id', userId)
            .limit(1)
            .maybeSingle();

          if (memberProveedor?.proveedor_id) {
            entityRole = 'provider';
            entityId = memberProveedor.proveedor_id;
            const ent = (memberProveedor as any)?.proveedores;
            entidadEstado = ent?.estado ?? null;
            logoUrl = resolverLogoUrl(ent?.bucket_logo, ent?.ruta_logo);
          }
        }

        // Fetch subscription estado for gating content sections
        let subscriptionEstado: string | null = null;
        if (entityId && entityRole) {
          const fk = entityRole === 'company' ? 'empresa_id' : 'proveedor_id';
          const { data: sub } = await supabase
            .from('suscripciones')
            .select('estado')
            .eq(fk, entityId)
            .order('creado_en', { ascending: false })
            .limit(1)
            .maybeSingle();
          subscriptionEstado = sub?.estado ?? null;
        }

        dbg('fetchProfile:done', { role: data.rol_sistema, entityRole, entityId, subscriptionEstado, entidadEstado });
        return {
          id: data.id,
          name: data.nombre_completo || email.split('@')[0],
          email: email,
          role: data.rol_sistema as any,
          isMember: data.activo || false,
          entityId: entityId,
          entityRole,
          subscriptionEstado,
          tutorialesVistos: (data.tutoriales_vistos ?? {}) as Record<string, string | null>,
          creadoEn: (data.creado_en ?? null) as string | null,
          entidadEstado,
          logoUrl,
        };
      }
    } catch (err) {
      console.error("[auth] fetchProfile error:", err);
    }
    return null;
  }, [supabase]);

  // Uses getUser() which validates the JWT server-side (NOT getSession() which only reads localStorage)
  const refreshUser = useCallback(async () => {
    dbg('refreshUser:start');
    // `loading` es un latch de una sola vía: sólo blanqueamos la UI con spinner
    // en la PRIMERA carga (cuando todavía no hay usuario). Los refrescos
    // posteriores (guardar datos, volver al tab, token refresh, health-check)
    // corren en segundo plano SIN blanquear el contenido. Esto mata el bug
    // "de repente queda en blanco y cargando" sin que el usuario toque nada.
    if (!currentUserRef.current) setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        dbg('refreshUser: no user', error?.message);
        // No borramos el contenido por un fallo transitorio si YA teníamos
        // sesión: la sesión realmente muerta la maneja el health-check.
        if (!currentUserRef.current) setCurrentUser(null);
      } else {
        const profile = await fetchProfile(user.id, user.email!);
        if (profile) aplicarPerfil(profile);
        else if (!currentUserRef.current) setCurrentUser(null);
      }
    } catch (err) {
      console.error('[auth] refreshUser error', err);
      // Error transitorio (timeout/red): mantenemos el usuario actual.
    } finally {
      setLoading(false);
      dbg('refreshUser:done');
    }
  }, [supabase, fetchProfile, aplicarPerfil]);

  /**
   * Primera resolución en el cliente, pensada para que el estado desconocido
   * dure lo menos posible:
   *  - `getSession()` lee la sesión de las cookies sin red. Sin sesión (la
   *    mayoría de las visitas) se resuelve "deslogueado" en el acto.
   *  - Con sesión y una copia local del mismo usuario, se pinta esa copia ya y
   *    `refreshUser()` la valida contra Supabase (getUser + perfil) de fondo.
   *  - Sin copia, el perfil se lee directo con la sesión de las cookies, SIN
   *    `getUser()` antes: auth-js retiene su lock durante ese viaje a Auth y las
   *    queries del perfil se encolaban detrás (4 viajes en serie, ~650 ms
   *    medido; con los picos de Auth, 2-4 s). Una sesión revocada la sigue
   *    detectando el health-check, como antes.
   */
  const resolverInicial = useCallback(async () => {
    resolviendoInicial.current = true;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        dbg('resolverInicial: sin sesión');
        if (!currentUserRef.current) setCurrentUser(null);
        setLoading(false);
        return;
      }
      const copia = leerCache(session.user.id);
      if (copia) {
        dbg('resolverInicial: copia local');
        currentUserRef.current = copia;
        aplicarPerfil(copia);
        setLoading(false);
        await refreshUser();
        return;
      }
      const perfil = await fetchProfile(session.user.id, session.user.email ?? '');
      if (perfil) {
        currentUserRef.current = perfil;
        aplicarPerfil(perfil);
      } else if (!currentUserRef.current) {
        setCurrentUser(null);
      }
      setLoading(false);
    } catch (err) {
      console.error('[auth] resolverInicial error', err);
      setLoading(false);
    } finally {
      resolviendoInicial.current = false;
    }
  }, [supabase, aplicarPerfil, refreshUser, fetchProfile]);

  const adoptarSemilla = useCallback((usuario: User) => {
    initialFetchDone.current = true;
    currentUserRef.current = usuario;
    aplicarPerfil(usuario);
    setLoading(false);
  }, [aplicarPerfil]);

  useEffect(() => {
    // Sólo si nadie resolvió todavía: ni `initialUser` ni una semilla del servidor.
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      void resolverInicial();
    }

    // Listen for auth state changes (login, logout, token refresh)
    //
    // El callback NO puede ser async ni awaitear nada de Supabase: auth-js lo
    // invoca DENTRO de su lock interno (`_acquireLock`) y espera a que termine.
    // Cualquier query adentro pide el token con getSession(), que se encola
    // detrás de ese mismo lock → deadlock permanente del cliente del browser.
    // El `lockNoOp` de cliente.ts no lo evita (ése es el lock entre pestañas;
    // la cola `pendingInLock` es otra) y el timeout de 15s tampoco, porque el
    // fetch nunca llega a salir.
    //
    // Se disparaba al VOLVER A LA PESTAÑA: auth-js emite SIGNED_IN en cada
    // visibilitychange. Síntoma (15-oct, Tecza): fue a Mercado Libre a copiar el
    // link, volvió, "Crear ítem" creó el ítem (Server Action, no usa este
    // cliente) y la subida de la foto quedó girando para siempre hasta F5.
    //
    // Fix recomendado por Supabase: diferir el trabajo con setTimeout(0) para
    // que corra después de que auth-js suelte el lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      dbg('onAuthStateChange:', event, session ? 'session=yes' : 'session=no');
      setTimeout(() => { void manejarCambioDeSesion(event, session); }, 0);
    });

    const manejarCambioDeSesion = async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // auth-js re-emite SIGNED_IN en CADA vuelta a la pestaña. Si es el
        // mismo usuario que ya tenemos no hay nada nuevo que leer: antes esto
        // disparaba tres queries en serie desde el browser (perfil, membresía,
        // suscripción) y re-renderizaba la app entera — 191 componentes en el
        // panel por cada vez que alguien volvía a la pestaña (medido el
        // 2026-10-20). Los datos se siguen refrescando: con TOKEN_REFRESHED
        // (~cada 50 min), con `refreshUser()` después de guardar, en cada
        // carga completa (`resolverInicial`) y con la semilla de las privadas.
        if (event === 'SIGNED_IN' && session?.user && currentUserRef.current?.id === session.user.id) {
          setLoading(false);
          return;
        }
        if (event === 'SIGNED_IN' && resolviendoInicial.current) return;
        // El try/finally y el guard de abajo son los mismos que ya tenía
        // `refreshUser`. Este handler se quedó afuera del fix de 188623b y era el
        // agujero por donde volvía el bug: TOKEN_REFRESHED llega solo cada ~50
        // min, y si `fetchProfile` fallaba por un hipo de red, este
        // `setCurrentUser(profile)` con profile=null borraba al usuario sin que
        // nadie tocara nada — la sesión "se caía sola" a mitad de navegación.
        try {
          if (session?.user) {
            const profile = await fetchProfile(session.user.id, session.user.email!);
            if (profile) aplicarPerfil(profile);
            else if (!currentUserRef.current) setCurrentUser(null);
          }
        } finally {
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setLoading(false);
      } else if (event === 'USER_UPDATED' && !session) {
        // Token refresh falló (refresh token vencido). Forzamos reload para
        // que el middleware redirija a /login y no quedemos en estado zombie.
        if (typeof window !== 'undefined') window.location.href = '/';
      }
      // Ignore INITIAL_SESSION — we handle it ourselves via initialUser or refreshUser
    };

    // ── Health check periódico (cada 60s) ────────────────────────────────────
    // Detecta el caso "navegué un rato y quedó colgado": cada minuto validamos
    // que la sesión sigue viva. Si falla 2 veces seguidas (probable token
    // muerto), forzamos reload para que el middleware nos mande al login.
    let healthFailCount = 0;
    const healthCheck = async () => {
      if (!currentUserRef.current) return; // Sin user logueado no tiene sentido
      if (document.visibilityState !== 'visible') return; // No gastar en background
      try {
        const res = await Promise.race([
          supabase.auth.getUser(),
          new Promise<any>((_, rej) => setTimeout(() => rej(new Error('healthcheck timeout')), 8000)),
        ]);
        if (res.error || !res.data?.user) {
          // El server respondió que NO hay usuario: posible sesión muerta.
          healthFailCount++;
          dbg('healthcheck: auth FAILED', healthFailCount, res.error?.message);
          if (healthFailCount >= 2) {
            // Último intento antes de rendirnos: refrescar la sesión.
            const { data: refreshed } = await supabase.auth.refreshSession();
            if (refreshed?.session) {
              healthFailCount = 0;
              dbg('healthcheck: sesión recuperada con refreshSession');
            } else {
              console.warn('[auth] Sesión muerta confirmada — a /login');
              if (typeof window !== 'undefined') window.location.href = '/login';
            }
          }
        } else {
          if (healthFailCount > 0) dbg('healthcheck: recovered');
          healthFailCount = 0;
        }
      } catch (err) {
        // Timeout / red: NO es una sesión muerta, es un cuelgue transitorio.
        // No recargamos la página ni tocamos al usuario (eso causaba el
        // "de repente queda en blanco cargando" sin acción del usuario).
        // Tampoco reciclamos el cliente: dos clientes vivos refrescando el
        // mismo token hacen que Supabase revoque la familia (ver cliente.ts).
        dbg('healthcheck: timeout/red — se ignora, reintenta en 60s', err);
      }
    };
    const healthInterval = setInterval(healthCheck, 60_000);

    // ── Revalidación al volver al tab ────────────────────────────────────────
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      dbg('visibilitychange: visible');
      if (!currentUserRef.current) return;
      // Aprovechamos para correr un healthcheck inmediato al volver.
      healthCheck();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(healthInterval);
    };
  }, [supabase, fetchProfile, resolverInicial, aplicarPerfil]);

  const isLoggingOut = useRef(false);

  // ─── LOGOUT ─────────────────────────────────────────────────────────────────
  // CRÍTICO: con @supabase/ssr la sesión vive en cookies httpOnly que el
  // cliente browser NO puede borrar. `signOut({ scope: 'local' })` solo
  // limpia localStorage (vacío). Las cookies quedan intactas y el middleware
  // server-side sigue viendo la sesión como válida → redirige de vuelta a
  // dashboard → "finge que cerró sesión pero no cerró".
  //
  // Fix real: llamar a una route handler que corre server-side y SÍ puede
  // borrar las cookies via el callback `setAll` del supabase server client.
  const logout = useCallback(async () => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    console.log('[logout] iniciando');

    // Feedback inmediato al usuario (antes incluso del roundtrip al servidor).
    setCurrentUser(null);
    // A mano y no por el efecto: el redirect de abajo puede salir antes.
    escribirCache(null);

    // Llamar al endpoint server-side con timeout de 4s.
    // `credentials: 'same-origin'` para que envíe las cookies sb-*.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('[logout] timeout 4s — abortando fetch');
      controller.abort();
    }, 4000);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        signal: controller.signal,
      });
      console.log('[logout] response:', response.status);
    } catch (err) {
      // AbortError es esperado si excede 4s. Otros errores los logueamos pero
      // no bloqueamos el redirect — la cookie ya está (probablemente) limpia.
      console.warn('[logout] fetch falló:', err);
    } finally {
      clearTimeout(timeoutId);
    }

    // También signOut en el cliente browser (limpia state en memoria,
    // dispara onAuthStateChange con SIGNED_OUT).
    supabase.auth.signOut({ scope: 'local' }).catch(() => {});

    // Hard redirect: bypasea el router cache de Next.js. El middleware
    // ahora recibe el request SIN cookies sb-* → isProtectedRoute=true →
    // redirige a /login, o / muestra el landing público.
    console.log('[logout] redirigiendo a /');
    if (typeof window !== 'undefined') {
      // Full reload — no router.push() (mantiene cache).
      window.location.href = '/';
    } else {
      router.push('/');
    }
  }, [supabase, router]);

  // Memoizado: un objeto literal nuevo en cada render del provider (por
  // ejemplo al abrir el modal de login) re-renderizaba a todos los consumidores
  // aunque ninguno de los valores hubiera cambiado.
  const valor = useMemo(
    () => ({
      currentUser,
      loading,
      logout,
      refreshUser,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
    }),
    [currentUser, loading, logout, refreshUser, isAuthModalOpen, openAuthModal, closeAuthModal]
  );

  return (
    <AuthContext.Provider value={valor}>
      <AdoptarSemillaContext.Provider value={adoptarSemilla}>
        {children}
      </AdoptarSemillaContext.Provider>
    </AuthContext.Provider>
  );
}

/**
 * Siembra el usuario que ya resolvió el servidor, para las páginas privadas
 * (dinámicas de todos modos). La pone `ConUsuarioDelServidor`.
 *
 * Dos efectos:
 *  - Su subárbol lee la semilla mientras el provider está en estado
 *    desconocido, así que el HTML del servidor ya sale con el panel armado y
 *    la hidratación coincide (el provider arranca igual en los dos lados).
 *  - Al hidratar, el provider la adopta (layout effect: antes de que el
 *    provider decida resolver por su cuenta) y el header sale de su
 *    placeholder sin ir a la red.
 *
 * Una semilla en null (sin sesión) no siembra nada: decide el provider.
 */
export function SemillaUsuario({ usuario, children }: { usuario: User | null; children: ReactNode }) {
  const adoptar = useContext(AdoptarSemillaContext);
  useLayoutEffect(() => {
    if (usuario) adoptar?.(usuario);
  }, [usuario, adoptar]);
  return (
    <SemillaContext.Provider value={usuario ?? undefined}>
      {children}
    </SemillaContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  const semilla = useContext(SemillaContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  // En el estado desconocido, adentro de una página privada manda la semilla.
  const usaSemilla = context.loading && !context.currentUser && semilla !== undefined;
  return useMemo(
    () => (usaSemilla ? { ...context, currentUser: semilla!, loading: false } : context),
    [usaSemilla, context, semilla]
  );
}
