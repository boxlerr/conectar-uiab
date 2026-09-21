import type { SupabaseClient } from "@supabase/supabase-js";
import { llamarAccion, fallo } from "@/lib/accion-segura";
import { prepararSubidaImagen } from "./acciones";
import { BUCKET_BOLETIN, EXTENSION_POR_MIME } from "./tipos";

/**
 * Sube la foto de una publicación desde el browser. La usan el panel de admin y
 * el cuadro para publicar del feed.
 *
 * El bucket no deja escribir en `boletin/` desde el browser: el servidor firma
 * una subida de un solo uso y arma la ruta (ver `prepararSubidaImagen`), y acá
 * se sube directo a Storage con ese token.
 */

/** 4 MB: entra sobrado para una foto de nota y no castiga al que sube desde el cel. */
export const MAX_FOTO_BYTES = 4 * 1024 * 1024;

export const MIME_FOTO = Object.keys(EXTENSION_POR_MIME);

export async function subirFotoComunicado(
  supabase: SupabaseClient,
  file: File
): Promise<{ ruta: string; url: string } | { error: string }> {
  if (!MIME_FOTO.includes(file.type)) {
    return { error: "Formato no válido. Subí una imagen JPG, PNG o WebP." };
  }
  if (file.size > MAX_FOTO_BYTES) {
    return { error: "La imagen supera los 4 MB. Probá con una más liviana." };
  }

  const firma = await llamarAccion(() => prepararSubidaImagen(file.type));
  if (fallo(firma)) return { error: firma.error };

  const { error } = await supabase.storage
    .from(BUCKET_BOLETIN)
    .uploadToSignedUrl(firma.ruta, firma.token, file, {
      contentType: file.type,
      cacheControl: "2678400",
    });
  if (error) return { error: "No pudimos subir la imagen. Intentá de nuevo." };

  const url = supabase.storage.from(BUCKET_BOLETIN).getPublicUrl(firma.ruta).data.publicUrl;
  return { ruta: firma.ruta, url };
}
