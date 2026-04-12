import { createClient } from "@supabase/supabase-js";
import { PanelUsuarios } from "./PanelUsuarios";

async function getUsuarios() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre_completo, email, rol_sistema, activo, telefono, creado_en, actualizado_en")
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function AdminUsuariosPage() {
  const usuarios = await getUsuarios();
  return <PanelUsuarios usuarios={usuarios as any} />;
}
