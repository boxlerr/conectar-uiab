import { createClient } from "@supabase/supabase-js";
import { leerEstadoAuth } from "@/modulos/admin/estado-acceso";
import { PanelUsuarios } from "./PanelUsuarios";

/**
 * Listado de accesos de toda la plataforma.
 *
 * Además del perfil se resuelven dos cosas que no viven en `perfiles`:
 *  - la ficha a la que pertenece (miembros_empresa / miembros_proveedor), que es
 *    lo que permite ver quién entra por cada socia ahora que cada empresa da de
 *    alta a su propia gente;
 *  - el último ingreso, que está en auth.users y sólo se lee con service_role.
 */
async function getUsuarios() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: perfiles, error }, { data: miembrosEmpresa }, { data: miembrosProveedor }] =
    await Promise.all([
      supabase
        .from("perfiles")
        .select(
          "id, nombre_completo, email, cargo, rol_sistema, activo, telefono, creado_en, actualizado_en"
        )
        .order("creado_en", { ascending: false }),
      supabase
        .from("miembros_empresa")
        .select("perfil_id, es_principal, empresas:empresa_id(razon_social, nombre_comercial)"),
      supabase
        .from("miembros_proveedor")
        .select("perfil_id, es_principal, proveedores:proveedor_id(nombre, razon_social)"),
    ]);

  if (error) throw new Error(error.message);

  type Ficha = { nombre: string; tipo: "empresa" | "proveedor"; esPrincipal: boolean };
  const fichaPorPerfil = new Map<string, Ficha>();

  type MiembroEmpresa = {
    perfil_id: string;
    es_principal: boolean;
    empresas: { razon_social: string | null; nombre_comercial: string | null } | null;
  };
  type MiembroProveedor = {
    perfil_id: string;
    es_principal: boolean;
    proveedores: { nombre: string | null; razon_social: string | null } | null;
  };

  for (const m of (miembrosEmpresa ?? []) as unknown as MiembroEmpresa[]) {
    const e = m.empresas;
    if (!e) continue;
    fichaPorPerfil.set(m.perfil_id, {
      nombre: e.nombre_comercial || e.razon_social || "Empresa sin nombre",
      tipo: "empresa",
      esPrincipal: Boolean(m.es_principal),
    });
  }
  for (const m of (miembrosProveedor ?? []) as unknown as MiembroProveedor[]) {
    const p = m.proveedores;
    if (!p || fichaPorPerfil.has(m.perfil_id)) continue;
    fichaPorPerfil.set(m.perfil_id, {
      nombre: p.nombre || p.razon_social || "Prestador sin nombre",
      tipo: "proveedor",
      esPrincipal: Boolean(m.es_principal),
    });
  }

  // Estado real en Auth: una sola pasada paginada por auth.users, mucho más
  // barato que pedirlo usuario por usuario cuando la lista es de toda la
  // plataforma.
  //
  // Hasta el 2026-08-13 de acá sólo se sacaba `last_sign_in_at` y el chip de
  // "Estado" se pintaba con `perfiles.activo`, que es apenas uno de los tres
  // frenos posibles. El panel decía "Activo" mientras la persona no podía
  // entrar: le pasó a Naves del Sur, que estuvo afuera con el chip verde.
  let estadoAuth = new Map<
    string,
    { email: string | null; ultimoIngreso: string | null; baneadoHasta: string | null; emailConfirmado: boolean }
  >();
  try {
    estadoAuth = await leerEstadoAuth(supabase);
  } catch (e) {
    // Sin Auth la tabla igual sirve, pero hay que decirlo: si esto falla en
    // silencio volvemos al chip que miente.
    console.error("[admin/usuarios] no se pudo leer el estado de Auth:", e);
  }

  // Usuarios de Auth SIN perfil. Esta pantalla lista `perfiles`, así que un
  // huérfano era literalmente invisible: no lo veías por ningún lado y encima
  // tenía el email tomado, así que esa persona no se podía volver a registrar.
  // Pasa cuando el signUp del browser sale bien y el paso siguiente no (ver
  // register-sync). Se muestran como filas propias para poder detectarlos.
  const idsConPerfil = new Set((perfiles ?? []).map((p) => p.id as string));
  const huerfanos = [...estadoAuth.entries()]
    .filter(([id]) => !idsConPerfil.has(id))
    .map(([id, auth]) => ({
      id,
      nombre_completo: null,
      email: auth.email ?? "(sin correo)",
      cargo: null,
      rol_sistema: null,
      activo: false,
      telefono: null,
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
      ficha_nombre: null,
      ficha_tipo: null as "empresa" | "proveedor" | null,
      es_principal: false,
      ultimo_ingreso: auth.ultimoIngreso,
      baneado_hasta: auth.baneadoHasta,
      email_confirmado: auth.emailConfirmado,
      sin_usuario_auth: false,
      /** Existe en Auth pero no tiene fila en `perfiles`. */
      sin_perfil: true,
    }));

  const filas = (perfiles ?? []).map((p) => {
    const id = p.id as string;
    const ficha = fichaPorPerfil.get(id);
    const auth = estadoAuth.get(id);
    return {
      id,
      nombre_completo: (p.nombre_completo as string | null) ?? null,
      email: (p.email as string | null) ?? "",
      cargo: (p.cargo as string | null) ?? null,
      rol_sistema: (p.rol_sistema as string | null) ?? null,
      activo: Boolean(p.activo),
      telefono: (p.telefono as string | null) ?? null,
      creado_en: p.creado_en as string,
      actualizado_en: p.actualizado_en as string,
      ficha_nombre: ficha?.nombre ?? null,
      ficha_tipo: ficha?.tipo ?? null,
      es_principal: ficha?.esPrincipal ?? false,
      ultimo_ingreso: auth?.ultimoIngreso ?? null,
      baneado_hasta: auth?.baneadoHasta ?? null,
      // Con Auth caído no inventamos: `null` = no lo sabemos, y el panel lo dice
      // así en vez de mostrar un "sin confirmar" que sería mentira.
      email_confirmado: auth ? auth.emailConfirmado : null,
      /** El perfil existe pero no hay usuario de Auth: alguien lo borró a mano. */
      sin_usuario_auth: estadoAuth.size > 0 && !auth,
      sin_perfil: false,
    };
  });

  // Los huérfanos van primero: son los que hay que resolver.
  return [...huerfanos, ...filas];
}

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  // `?estado=pendientes` deja la pestaña de "Pendientes de habilitar" abierta:
  // es a donde apunta el contador del dashboard, y sin esto el link caía en la
  // lista completa y había que buscar a mano quién estaba trabado.
  const [usuarios, { estado }] = await Promise.all([getUsuarios(), searchParams]);
  return (
    <PanelUsuarios
      usuarios={usuarios}
      filtroInicial={estado === "pendientes" ? "pendientes" : "all"}
    />
  );
}
