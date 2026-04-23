"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/tipos";
import { createClient } from "@/lib/supabase/cliente";

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

interface AuthProviderProps {
  children: ReactNode;
  /** Initial user resolved on the server — avoids loading flash on first render */
  initialUser?: User | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  // When initialUser is provided from the server, we skip the loading state entirely
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  // Guard against running the initial fetch if we already have a server user
  const initialFetchDone = useRef(!!initialUser);
  // Ref al currentUser para leer valor actual dentro de listeners sin re-suscribir
  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const fetchProfile = useCallback(async (userId: string, email: string): Promise<User | null> => {
    dbg('fetchProfile:start', userId);
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single();

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

        // Fetch Business Layer ID mapping
        if (data.rol_sistema === 'company') {
          const { data: memberData } = await supabase
            .from('miembros_empresa')
            .select('empresa_id, empresas:empresa_id(estado)')
            .eq('perfil_id', userId)
            .single();
          entityId = memberData?.empresa_id;
          entidadEstado = (memberData as any)?.empresas?.estado ?? null;
        } else if (data.rol_sistema === 'provider') {
          const { data: memberData } = await supabase
            .from('miembros_proveedor')
            .select('proveedor_id, proveedores:proveedor_id(estado)')
            .eq('perfil_id', userId)
            .single();
          entityId = memberData?.proveedor_id;
          entidadEstado = (memberData as any)?.proveedores?.estado ?? null;
        }

        // Fetch subscription estado for gating content sections
        let subscriptionEstado: string | null = null;
        if (entityId && (data.rol_sistema === 'company' || data.rol_sistema === 'provider')) {
          const fk = data.rol_sistema === 'company' ? 'empresa_id' : 'proveedor_id';
          const { data: sub } = await supabase
            .from('suscripciones')
            .select('estado')
            .eq(fk, entityId)
            .order('creado_en', { ascending: false })
            .limit(1)
            .maybeSingle();
          subscriptionEstado = sub?.estado ?? null;
        }

        dbg('fetchProfile:done', { role: data.rol_sistema, entityId, subscriptionEstado, entidadEstado });
        return {
          id: data.id,
          name: data.nombre_completo || email.split('@')[0],
          email: email,
          role: data.rol_sistema as any,
          isMember: data.activo || false,
          entityId: entityId,
          subscriptionEstado,
          tutorialesVistos: (data.tutoriales_vistos ?? {}) as Record<string, string | null>,
          entidadEstado,
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
    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        dbg('refreshUser: no user', error?.message);
        setCurrentUser(null);
      } else {
        const profile = await fetchProfile(user.id, user.email!);
        setCurrentUser(profile);
      }
    } catch (err) {
      console.error('[auth] refreshUser error', err);
      setCurrentUser(null);
    } finally {
      setLoading(false);
      dbg('refreshUser:done');
    }
  }, [supabase, fetchProfile]);

  useEffect(() => {
    // Only fetch on mount if we didn't receive initialUser from the server
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      refreshUser();
    }

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      dbg('onAuthStateChange:', event, session ? 'session=yes' : 'session=no');
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email!);
          setCurrentUser(profile);
        }
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setLoading(false);
      } else if (event === 'USER_UPDATED' && !session) {
        // Token refresh falló (refresh token vencido). Forzamos reload para
        // que el middleware redirija a /login y no quedemos en estado zombie.
        if (typeof window !== 'undefined') window.location.href = '/';
      }
      // Ignore INITIAL_SESSION — we handle it ourselves via initialUser or refreshUser
    });

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
          healthFailCount++;
          dbg('healthcheck: FAILED', healthFailCount, '/', 2, res.error?.message);
          if (healthFailCount >= 2) {
            console.warn('[auth] Sesión perdida detectada por health-check — recargando');
            if (typeof window !== 'undefined') window.location.href = '/';
          }
        } else {
          if (healthFailCount > 0) dbg('healthcheck: recovered');
          healthFailCount = 0;
        }
      } catch (err) {
        healthFailCount++;
        dbg('healthcheck: exception', healthFailCount, err);
        if (healthFailCount >= 2 && typeof window !== 'undefined') {
          console.warn('[auth] Health-check sigue fallando — recargando');
          window.location.reload();
        }
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
  }, [supabase, fetchProfile, refreshUser]);

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
  const logout = async () => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    console.log('[logout] iniciando');

    // Feedback inmediato al usuario (antes incluso del roundtrip al servidor).
    setCurrentUser(null);

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
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        logout,
        refreshUser,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
