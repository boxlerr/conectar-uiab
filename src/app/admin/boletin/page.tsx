import { createClient } from "@supabase/supabase-js";
import type { Comunicado } from "@/modulos/boletin/tipos";
import { PanelBoletin } from "./PanelBoletin";

// El panel ve TODO (borradores incluidos), así que lee con service role igual
// que /admin/oportunidades. La socia sólo ve lo publicado, y eso lo garantiza
// la policy de SELECT cuando lee desde el browser / las pantallas públicas.
async function getComunicados(): Promise<Comunicado[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await supabase
    .from("comunicados")
    .select(
      "id, titulo, bajada, cuerpo, bucket, rutas_imagenes, estado, fijado, publicado_en, creado_por, creado_en, actualizado_en"
    )
    // Borradores primero (lo que falta terminar), después lo publicado más nuevo.
    .order("estado", { ascending: true })
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Comunicado[];
}

export default async function AdminBoletinPage() {
  const comunicados = await getComunicados();
  return <PanelBoletin comunicados={comunicados} />;
}
