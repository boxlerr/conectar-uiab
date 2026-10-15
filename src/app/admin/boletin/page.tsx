import { createClient } from "@supabase/supabase-js";
import type { ComunicadoAdmin } from "@/modulos/boletin/tipos";
import { vistasPorComunicado } from "@/modulos/boletin/vistas";
import { PanelBoletin } from "./PanelBoletin";

// El panel ve TODO (borradores incluidos), así que lee con service role igual
// que /admin/oportunidades. La socia sólo ve lo publicado, y eso lo garantiza
// la policy de SELECT cuando lee desde el browser / las pantallas públicas.
//
// Las tres columnas del aviso por email se leen SÓLO acá: las pantallas
// públicas (/boletin, el feed del panel de la socia) usan `consultas.ts`, que
// no las pide. Ver `ComunicadoAdmin` en tipos.ts.
async function getComunicados(): Promise<ComunicadoAdmin[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await supabase
    .from("comunicados")
    .select(
      "id, titulo, bajada, cuerpo, bucket, rutas_imagenes, estado, fijado, publicado_en, creado_por, creado_en, actualizado_en, avisar_por_email, aviso_enviado_en, aviso_destinatarios"
    )
    // Borradores primero (lo que falta terminar), después lo publicado más nuevo.
    .order("estado", { ascending: true })
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ComunicadoAdmin[];
}

export default async function AdminBoletinPage() {
  // /admin está cortado por rol en el middleware (del lado del servidor), así
  // que las vistas sólo llegan a un admin. `null` si la base no contestó: el
  // panel no muestra el ojito antes que mostrar ceros.
  const [comunicados, vistas] = await Promise.all([getComunicados(), vistasPorComunicado()]);
  return <PanelBoletin comunicados={comunicados} vistas={vistas} />;
}
