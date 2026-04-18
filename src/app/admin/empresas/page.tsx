import { createClient } from "@supabase/supabase-js";
import { PanelEmpresas } from "./PanelEmpresas";

async function getEmpresas() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await supabase
    .from("empresas")
    .select("id, razon_social, nombre_comercial, cuit, email, telefono, localidad, provincia, descripcion, estado, motivo_rechazo, tarifa, creado_en, aprobada_en")
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function AdminEmpresasPage() {
  const empresas = await getEmpresas();
  return <PanelEmpresas empresas={empresas} />;
}
