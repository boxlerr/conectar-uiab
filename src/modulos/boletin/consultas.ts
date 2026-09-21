import { createAdminClient } from "@/lib/supabase/admin";
import type { Comunicado, ComunicadoPublico } from "./tipos";

/**
 * Lectura de comunicados PUBLICADOS para las pantallas lectoras (el feed del
 * panel y la página /boletin).
 *
 * Lee con service role y filtra `estado = 'publicado'` a mano: es el mismo
 * criterio que /admin/oportunidades. Quién puede ver las pantallas lectoras lo
 * decide el middleware (ambas son sólo para socias). La policy de RLS igual
 * protege cualquier acceso desde el browser. Los borradores nunca salen de acá.
 *
 * Usa `createAdminClient` (con timeout) y no un `createClient` pelado: esta
 * consulta corre dentro de /panel-de-control, que ya usa ese mismo cliente en
 * todo lo demás desde el incidente del 2026-08-15 (ver lib/supabase/admin.ts).
 * Es exactamente el caso que ese archivo describe — una tira decorativa que no
 * puede colgar la carga del panel entero si Postgres tarda.
 *
 * No es `"use server"`: es un módulo de datos del servidor, no un Server Action.
 */

const CAMPOS =
  "id, titulo, cuerpo, bucket, ruta_imagen, estado, fijado, publicado_en, creado_por, creado_en, actualizado_en";

/**
 * Publicados, primero los fijados y después por fecha de publicación.
 * `limite` acota (el feed del panel pide pocos); sin él, trae todos (la página).
 */
export async function getComunicadosPublicados(limite?: number): Promise<ComunicadoPublico[]> {
  const supabase = createAdminClient();

  let consulta = supabase
    .from("comunicados")
    .select(CAMPOS)
    .eq("estado", "publicado")
    .order("fijado", { ascending: false })
    .order("publicado_en", { ascending: false, nullsFirst: false });

  if (limite) consulta = consulta.limit(limite);

  const { data, error } = await consulta;
  if (error) {
    // Una nota que no carga no puede tirar abajo el panel entero.
    console.error("[boletin] no se pudieron leer los comunicados:", error.message);
    return [];
  }

  return (data ?? []).map((c) => conImagen(supabase, c as Comunicado));
}

/** Un comunicado publicado, para su página. Null si no existe o es borrador. */
export async function getComunicadoPublicado(id: string): Promise<ComunicadoPublico | null> {
  // Un id que no es UUID hace fallar la query en Postgres: es un 404, no un error.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("comunicados")
    .select(CAMPOS)
    .eq("id", id)
    .eq("estado", "publicado")
    .maybeSingle();

  if (error) {
    console.error("[boletin] no se pudo leer el comunicado:", error.message);
    return null;
  }
  return data ? conImagen(supabase, data as Comunicado) : null;
}

function conImagen(
  supabase: ReturnType<typeof createAdminClient>,
  fila: Comunicado
): ComunicadoPublico {
  const imagenUrl =
    fila.bucket && fila.ruta_imagen
      ? supabase.storage.from(fila.bucket).getPublicUrl(fila.ruta_imagen).data.publicUrl
      : null;
  return { ...fila, imagenUrl };
}
