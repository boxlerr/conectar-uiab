import { createClient } from "@supabase/supabase-js";
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

  // Último ingreso: una sola pasada paginada por auth.users, mucho más barato
  // que pedirlo usuario por usuario cuando la lista es de toda la plataforma.
  const ultimoIngreso = new Map<string, string | null>();
  try {
    for (let page = 1; page <= 20; page++) {
      const { data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      const users = data?.users ?? [];
      for (const u of users) ultimoIngreso.set(u.id, u.last_sign_in_at ?? null);
      if (users.length < 200) break;
    }
  } catch {
    /* sin último ingreso la tabla igual sirve */
  }

  return (perfiles ?? []).map((p) => {
    const ficha = fichaPorPerfil.get(p.id as string);
    return {
      id: p.id as string,
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
      ultimo_ingreso: ultimoIngreso.get(p.id as string) ?? null,
    };
  });
}

export default async function AdminUsuariosPage() {
  const usuarios = await getUsuarios();
  return <PanelUsuarios usuarios={usuarios} />;
}
