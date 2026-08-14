import { createClient } from "@supabase/supabase-js";
import { PanelProveedores, type Particular, type ServicioDeclarado } from "./PanelProveedores";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const CAMPOS_PROVEEDOR =
  "id, nombre, apellido, razon_social, nombre_comercial, tipo_proveedor, cuit, email, " +
  "telefono, whatsapp, sitio_web, direccion, localidad, provincia, descripcion, " +
  "ruta_logo, ruta_portada, email_compras, email_mantenimiento, fecha_inicio_experiencia, " +
  "estado, motivo_rechazo, creado_en";

/**
 * Los servicios que declaró cada particular.
 *
 * Es la mitad que faltaba para poder decidir sobre una solicitud: sin saber qué
 * ofrece, aprobar o rechazar era a ciegas. Se trae también si el servicio es
 * oficial, porque el que no lo es se puede subir al catálogo desde la misma
 * pantalla de aprobación.
 */
async function getServicios(): Promise<Map<string, ServicioDeclarado[]>> {
  const { data } = await adminClient()
    .from("proveedores_categorias")
    .select("proveedor_id, categorias(id, nombre, administrado_por_admin, activa)");

  type Fila = {
    proveedor_id: string;
    categorias: {
      id: string;
      nombre: string;
      administrado_por_admin: boolean;
      activa: boolean;
    } | null;
  };

  const mapa = new Map<string, ServicioDeclarado[]>();
  for (const fila of (data ?? []) as unknown as Fila[]) {
    if (!fila.categorias) continue;
    const lista = mapa.get(fila.proveedor_id) ?? [];
    lista.push({
      id: fila.categorias.id,
      nombre: fila.categorias.nombre,
      oficial: fila.categorias.administrado_por_admin,
      activa: fila.categorias.activa,
    });
    mapa.set(fila.proveedor_id, lista);
  }
  for (const lista of mapa.values()) {
    lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }
  return mapa;
}

async function getProveedores(): Promise<Particular[]> {
  const [{ data, error }, servicios] = await Promise.all([
    adminClient()
      .from("proveedores")
      .select(CAMPOS_PROVEEDOR)
      .order("creado_en", { ascending: false }),
    getServicios(),
  ]);

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as Omit<Particular, "servicios">[]).map((p) => ({
    ...p,
    servicios: servicios.get(p.id) ?? [],
  }));
}

/**
 * Particulares que se registraron pero se quedaron sin ficha.
 *
 * Esta pantalla lista la tabla `proveedores`, que hoy está VACÍA: María Noel
 * Valle se registró como particular el 17-jun, quedó con `rol_sistema='provider'`
 * y nunca se le creó la ficha, así que no aparecía por ningún lado. Desde el
 * panel era indistinguible de "no se registró nadie".
 *
 * Se los muestra como filas propias, en estado "Sin ficha": no hay nada que
 * aprobar —no existe el perfil que aprobarías— pero al menos se ven y se puede
 * decidir qué hacer.
 */
async function getParticularesSinFicha(): Promise<Particular[]> {
  const db = adminClient();

  const [{ data: perfiles }, { data: miembros }] = await Promise.all([
    db
      .from("perfiles")
      .select("id, nombre_completo, email, telefono, activo, creado_en")
      .eq("rol_sistema", "provider"),
    db.from("miembros_proveedor").select("perfil_id"),
  ]);

  const conFicha = new Set((miembros ?? []).map((m) => (m as { perfil_id: string }).perfil_id));

  return (perfiles ?? [])
    .filter((p) => !conFicha.has(p.id as string))
    .map((p) => ({
      id: p.id as string,
      nombre: (p.nombre_completo as string | null) ?? (p.email as string),
      apellido: null,
      razon_social: null,
      nombre_comercial: null,
      tipo_proveedor: null,
      cuit: null,
      email: (p.email as string | null) ?? null,
      telefono: (p.telefono as string | null) ?? null,
      whatsapp: null,
      sitio_web: null,
      direccion: null,
      localidad: null,
      provincia: null,
      descripcion: null,
      ruta_logo: null,
      ruta_portada: null,
      email_compras: null,
      email_mantenimiento: null,
      fecha_inicio_experiencia: null,
      estado: "sin_ficha",
      motivo_rechazo: null,
      creado_en: p.creado_en as string,
      servicios: [],
      sin_ficha: true as const,
      perfil_activo: Boolean(p.activo),
    }));
}

export default async function AdminProveedoresPage() {
  const [proveedores, sinFicha] = await Promise.all([
    getProveedores(),
    getParticularesSinFicha(),
  ]);
  // Los que no tienen ficha van primero: son los que hay que resolver.
  return <PanelProveedores proveedores={[...sinFicha, ...proveedores]} />;
}
