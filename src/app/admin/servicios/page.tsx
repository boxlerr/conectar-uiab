import { createClient } from "@supabase/supabase-js";
import { PanelServicios, type Servicio } from "./PanelServicios";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type FilaCategoria = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  activa: boolean;
  creado_en: string;
  administrado_por_admin: boolean;
  categoria_padre_id: string | null;
};

/**
 * El catálogo con su uso real.
 *
 * Sin los contadores no se puede curar: decidir si "resina" se borra, se fusiona
 * o se sube depende de cuánta gente la tenga elegida, y eso no estaba en pantalla.
 */
async function getServicios(): Promise<Servicio[]> {
  const db = adminClient();
  const [catRes, empRes, provRes] = await Promise.all([
    db
      .from("categorias")
      .select(
        "id, nombre, slug, descripcion, activa, creado_en, administrado_por_admin, categoria_padre_id"
      ),
    db.from("empresas_categorias").select("categoria_id"),
    db.from("proveedores_categorias").select("categoria_id"),
  ]);

  if (catRes.error) throw new Error(catRes.error.message);

  const contar = (filas: { categoria_id: string }[] | null) => {
    const mapa = new Map<string, number>();
    for (const f of filas ?? []) {
      mapa.set(f.categoria_id, (mapa.get(f.categoria_id) ?? 0) + 1);
    }
    return mapa;
  };

  const porEmpresa = contar(empRes.data as { categoria_id: string }[] | null);
  const porProveedor = contar(provRes.data as { categoria_id: string }[] | null);

  const filas = (catRes.data ?? []) as FilaCategoria[];
  const nombrePorId = new Map(filas.map((c) => [c.id, c.nombre]));
  const hijasPorPadre = new Map<string, number>();
  for (const c of filas) {
    if (c.categoria_padre_id) {
      hijasPorPadre.set(
        c.categoria_padre_id,
        (hijasPorPadre.get(c.categoria_padre_id) ?? 0) + 1
      );
    }
  }

  return filas
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      slug: c.slug,
      descripcion: c.descripcion,
      activa: c.activa,
      creado_en: c.creado_en,
      administrado_por_admin: c.administrado_por_admin,
      padre: c.categoria_padre_id ? nombrePorId.get(c.categoria_padre_id) ?? null : null,
      empresas: porEmpresa.get(c.id) ?? 0,
      particulares: porProveedor.get(c.id) ?? 0,
      hijas: hijasPorPadre.get(c.id) ?? 0,
    }))
    .sort(
      (a, b) =>
        // Las propuestas de los socios primero: son la bandeja de curaduría.
        Number(a.administrado_por_admin) - Number(b.administrado_por_admin) ||
        a.nombre.localeCompare(b.nombre, "es")
    );
}

export default async function AdminServiciosPage() {
  const servicios = await getServicios();
  return <PanelServicios servicios={servicios} />;
}
