import { createClient } from "@supabase/supabase-js";
import { PanelSuscripciones } from "./PanelSuscripciones";

async function getSuscripciones() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: empresas, error: errEmpresas }, { data: proveedores, error: errProveedores }] = await Promise.all([
    supabase
      .from("empresas")
      .select("id, razon_social, email, estado, tarifa, creado_en")
      .eq("estado", "aprobada")
      .order("tarifa", { ascending: true, nullsFirst: false }),
    supabase
      .from("proveedores")
      .select("id, nombre, apellido, email, estado, creado_en")
      .eq("estado", "aprobado")
      .order("creado_en", { ascending: false }),
  ]);

  if (errEmpresas) throw new Error(errEmpresas.message);
  if (errProveedores) throw new Error(errProveedores.message);

  return { empresas: empresas ?? [], proveedores: proveedores ?? [] };
}

export default async function AdminSuscripcionesPage() {
  const data = await getSuscripciones();
  return <PanelSuscripciones {...(data as any)} />;
}
