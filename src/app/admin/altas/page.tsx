import { createClient } from "@supabase/supabase-js";
import { PanelAltas } from "./PanelAltas";

async function getAltas() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await supabase
    .from("altas_socios")
    .select(
      "id, razon_social, nombre_comercial, cuit, actividad, categoria, ya_es_socio, n_socio, referente_nombre, referente_cargo, email, telefono, sitio_web, localidad, direccion, mensaje, estado, empresa_id, creado_en, actualizado_en"
    )
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

async function getEmpresas() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await supabase
    .from("empresas")
    .select("id, razon_social, nombre_comercial, cuit, n_socio, estado")
    .order("razon_social");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function AdminAltasPage() {
  const [altas, empresas] = await Promise.all([getAltas(), getEmpresas()]);
  return <PanelAltas altas={altas as never} empresas={empresas as never} />;
}
