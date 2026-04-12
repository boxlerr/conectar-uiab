import { createClient } from "@supabase/supabase-js";
import { PanelOportunidades } from "./PanelOportunidades";

async function getOportunidades() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await supabase
    .from("oportunidades")
    .select(`
      id, titulo, descripcion, estado, visibilidad, localidad, fecha_necesidad, creado_en,
      empresa:empresas!empresa_solicitante_id(razon_social),
      categoria:categorias!categoria_id(nombre)
    `)
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function AdminOportunidadesPage() {
  const oportunidades = await getOportunidades();
  return <PanelOportunidades oportunidades={oportunidades as any} />;
}
