import { createClient } from "@supabase/supabase-js";
import { PanelEtiquetas, type EtiquetaAdmin } from "./PanelEtiquetas";

async function getEtiquetas(): Promise<EtiquetaAdmin[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data, error }, { data: empresas }, { data: proveedores }] = await Promise.all([
    supabase
      .from("tags")
      .select(
        "id, nombre, slug, tipo_tag, activo, administrado_por_admin, creado_en, creado_por_empresa, creado_por_proveedor, empresas_tags(count), proveedores_tags(count)"
      )
      .order("administrado_por_admin", { ascending: true })
      .order("creado_en", { ascending: false }),
    supabase.from("empresas").select("id, razon_social"),
    supabase.from("proveedores").select("id, nombre, apellido, nombre_comercial"),
  ]);

  if (error) throw new Error(error.message);

  const nombreEmpresa = new Map(
    (empresas ?? []).map((e) => [e.id as string, e.razon_social as string])
  );
  const nombreProveedor = new Map(
    (proveedores ?? []).map((p) => [
      p.id as string,
      (p.nombre_comercial as string) ||
        [p.nombre, p.apellido].filter(Boolean).join(" ") ||
        "Sin nombre",
    ])
  );

  // PostgREST devuelve los agregados como [{ count: n }].
  const contar = (agg: unknown) =>
    Array.isArray(agg) ? ((agg[0] as { count?: number })?.count ?? 0) : 0;

  return (data ?? []).map((t) => ({
    id: t.id as string,
    nombre: t.nombre as string,
    slug: t.slug as string,
    tipo_tag: t.tipo_tag as string,
    activo: t.activo as boolean,
    administrado_por_admin: t.administrado_por_admin as boolean,
    creado_en: t.creado_en as string,
    autor:
      (t.creado_por_empresa
        ? nombreEmpresa.get(t.creado_por_empresa as string)
        : t.creado_por_proveedor
          ? nombreProveedor.get(t.creado_por_proveedor as string)
          : null) ?? null,
    usos: contar(t.empresas_tags) + contar(t.proveedores_tags),
  }));
}

export default async function AdminEtiquetasPage() {
  const etiquetas = await getEtiquetas();
  return <PanelEtiquetas etiquetas={etiquetas} />;
}
