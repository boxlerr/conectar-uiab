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

export default async function AdminProveedoresPage() {
  const proveedores = await getProveedores();
  return <PanelProveedores proveedores={proveedores} />;
}
