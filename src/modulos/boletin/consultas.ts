import { createAdminClient } from "@/lib/supabase/admin";
import type { Comunicado, ComunicadoPublico } from "./tipos";
import { prefijoIdDeSlug } from "./formato";

/**
 * Lectura de comunicados PUBLICADOS para las pantallas lectoras (el feed del
 * panel, /boletin y la página de cada nota).
 *
 * Lee con service role y filtra `estado = 'publicado'` a mano: es el mismo
 * criterio que /admin/oportunidades. Los borradores nunca salen de acá.
 *
 * El boletín es PÚBLICO (lo lee cualquiera, con o sin sesión) y por eso estas
 * consultas no miran al usuario. Que se lea con service role no abre nada: el
 * único filtro que importa es `estado = 'publicado'`, y está acá. La policy de
 * RLS de `comunicados` sigue siendo `to authenticated`, lo cual está bien
 * porque desde el browser nadie consulta la tabla: todo pasa por el servidor.
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
  "id, titulo, bajada, cuerpo, bucket, rutas_imagenes, estado, fijado, publicado_en, creado_por, creado_en, actualizado_en";

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

/** Un comunicado publicado por id. Null si no existe o es borrador. */
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

/**
 * La nota que corresponde a una URL del boletín, sea el slug nuevo
 * (`asi-se-ve-una-nota-fab6bc0e`) o un uuid pelado de los enlaces viejos.
 *
 * Resuelve por los 8 caracteres de id que el slug lleva al final (ver
 * `formato.ts`): primero busca el id completo entre los publicados —una
 * columna sola, son unas pocas filas— y después trae la nota. Así el enlace
 * sobrevive a que se corrija el título; de emparejar la URL con el slug actual
 * se encarga la página, con un 301.
 */
export async function getComunicadoPorSlug(slug: string): Promise<ComunicadoPublico | null> {
  const prefijo = prefijoIdDeSlug(slug);
  if (!prefijo) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("comunicados")
    .select("id")
    .eq("estado", "publicado");

  if (error) {
    console.error("[boletin] no se pudieron resolver los slugs:", error.message);
    return null;
  }

  const fila = (data ?? []).find((c) => (c.id as string).toLowerCase().startsWith(prefijo));
  return fila ? getComunicadoPublicado(fila.id as string) : null;
}

/**
 * Resuelve las rutas del bucket a URLs públicas. `imagenUrl` es la portada —la
 * primera— y se deriva ACÁ y en ningún otro lado: si cada pantalla hiciera su
 * propio `imagenes[0]`, la primera que se olvide muestra otra foto.
 */
function conImagen(
  supabase: ReturnType<typeof createAdminClient>,
  fila: Comunicado
): ComunicadoPublico {
  const rutas = fila.rutas_imagenes ?? [];
  const imagenes = fila.bucket
    ? rutas.map((r) => supabase.storage.from(fila.bucket!).getPublicUrl(r).data.publicUrl)
    : [];
  return { ...fila, rutas_imagenes: rutas, imagenes, imagenUrl: imagenes[0] ?? null };
}
