import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/servidor";
import { obtenerEntidadSesion, obtenerPerfilSesion, obtenerSesion } from "@/lib/supabase/sesion-servidor";
import { SemillaUsuario } from "@/modulos/autenticacion/contexto-autenticacion";
import type { User } from "@/tipos";

/**
 * Usuario de la sesión, armado en el servidor con la misma forma que el
 * `AuthProvider` arma en el cliente. Nunca tira: sin sesión o ante cualquier
 * error devuelve null.
 *
 * Vivía en el layout raíz y corría en CADA página. Eso leía cookies en todas
 * las rutas y por lo tanto las hacía dinámicas a todas: ninguna página pública
 * podía salir del CDN. Ahora lo usan sólo las secciones que igual son
 * dinámicas (panel, perfil, admin…), vía `ConUsuarioDelServidor`.
 *
 * Lo que importa son los viajes EN SERIE a Supabase: 2 rondas en paralelo,
 * perfil ∥ membresía, y después ficha ∥ suscripción. La sesión sale de
 * `getClaims()`, que se verifica sin red, y perfil/membresía vienen de
 * `sesion-servidor.ts`, cacheados por request: si la página pide lo mismo (el
 * panel lo hace) no se vuelve a consultar.
 *
 * Sin `import "server-only"` a propósito (ver sesion-servidor.ts).
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return null;

    // La ficha se resuelve por MEMBRESÍA, no por `rol_sistema`.
    //
    // Este código se quedó afuera de la migración a `entidad-del-perfil` y era
    // el que rompía: ramificaba en `rol_sistema === 'company' | 'provider'`, así
    // que un ADMIN con ficha propia (Vaxler) no matcheaba ninguna rama, salía con
    // `entityId: null` y sin `entityRole`. Y como el AuthProvider adopta este
    // objeto, el cliente NO vuelve a resolverlo: se queda con esta versión
    // incompleta. Resultado: /perfil rebotaba al admin con "Debes dirigirte al
    // panel de administración" aunque su ficha estuviera bien vinculada,
    // mientras /panel-de-control (que resuelve aparte) sí la mostraba.
    const [profile, entidad] = await Promise.all([
      obtenerPerfilSesion(sesion.id),
      obtenerEntidadSesion(sesion.id),
    ]);
    if (!profile) return null;

    const supabase = await createClient();
    const entityId = entidad?.id ?? null;
    const entityRole = entidad?.tipo ?? null;
    const tablaFicha = entidad?.tipo === "company" ? "empresas" : "proveedores";
    const fk = entidad?.tipo === "company" ? "empresa_id" : "proveedor_id";

    const [fichaRes, subRes] = await Promise.all([
      entidad
        ? supabase
            .from(tablaFicha)
            .select("estado, ruta_logo, bucket_logo")
            .eq("id", entidad.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      entidad
        ? supabase
            .from("suscripciones")
            .select("estado")
            .eq(fk, entidad.id)
            .order("creado_en", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const ficha = fichaRes.data as { estado: string | null; ruta_logo: string | null; bucket_logo: string | null } | null;
    const logoUrl =
      ficha?.bucket_logo && ficha?.ruta_logo
        ? supabase.storage.from(ficha.bucket_logo).getPublicUrl(ficha.ruta_logo).data?.publicUrl ?? null
        : null;
    const email = sesion.email ?? profile.email ?? "";

    return {
      id: profile.id,
      name: profile.nombre_completo || email.split("@")[0],
      email,
      role: profile.rol_sistema as User["role"],
      isMember: profile.activo || false,
      entityId,
      entityRole,
      subscriptionEstado: (subRes.data as { estado: string | null } | null)?.estado ?? null,
      tutorialesVistos: profile.tutoriales_vistos ?? {},
      creadoEn: profile.creado_en ?? null,
      entidadEstado: ficha?.estado ?? null,
      logoUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Envuelve una sección que igual es dinámica para que renderice con el usuario
 * ya resuelto: el HTML del servidor sale con el panel armado, sin spinner, y el
 * header lo toma al hidratar sin ir a la red.
 *
 * Lee cookies, así que hace dinámica a la ruta que lo use. NUNCA en una página
 * pública que tenga que salir del CDN (la ficha, /rubros, /nosotros…): esas
 * resuelven la sesión en el cliente.
 */
export async function ConUsuarioDelServidor({ children }: { children: ReactNode }) {
  const usuario = await getServerUser();
  return <SemillaUsuario usuario={usuario}>{children}</SemillaUsuario>;
}
