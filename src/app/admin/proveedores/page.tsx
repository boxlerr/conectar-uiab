import { createClient } from "@supabase/supabase-js";
import { PanelProveedores } from "./PanelProveedores";

async function getProveedores() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await supabase
    .from("proveedores")
    .select("id, nombre, apellido, nombre_comercial, tipo_proveedor, cuit, email, telefono, localidad, provincia, descripcion, estado, motivo_rechazo, creado_en")
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
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
async function getParticularesSinFicha() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: perfiles }, { data: miembros }] = await Promise.all([
    supabase
      .from("perfiles")
      .select("id, nombre_completo, email, telefono, activo, creado_en")
      .eq("rol_sistema", "provider"),
    supabase.from("miembros_proveedor").select("perfil_id"),
  ]);

  const conFicha = new Set((miembros ?? []).map((m) => (m as { perfil_id: string }).perfil_id));

  return (perfiles ?? [])
    .filter((p) => !conFicha.has(p.id as string))
    .map((p) => ({
      id: p.id as string,
      nombre: (p.nombre_completo as string | null) ?? (p.email as string),
      apellido: null,
      nombre_comercial: null,
      tipo_proveedor: null,
      cuit: null,
      email: (p.email as string | null) ?? null,
      telefono: (p.telefono as string | null) ?? null,
      localidad: null,
      provincia: null,
      descripcion: null,
      estado: "sin_ficha",
      motivo_rechazo: null,
      creado_en: p.creado_en as string,
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
  return <PanelProveedores proveedores={[...sinFicha, ...proveedores] as never} />;
}
