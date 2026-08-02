import { createClient } from "@supabase/supabase-js";
import { PanelServicios } from "./PanelServicios";

async function getServicios() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await supabase
    .from("categorias")
    .select("id, nombre, slug, descripcion, activa, creado_en, administrado_por_admin")
    // Las propuestas de los socios primero: son la bandeja de curaduría.
    .order("administrado_por_admin", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function AdminServiciosPage() {
  const servicios = await getServicios();
  return <PanelServicios servicios={servicios} />;
}
