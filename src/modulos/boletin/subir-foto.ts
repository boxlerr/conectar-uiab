import { llamarAccion, fallo } from "@/lib/accion-segura";
import { prepararSubidaImagen } from "./acciones";
import { BUCKET_BOLETIN, EXTENSION_POR_MIME } from "./tipos";

/**
 * Sube una foto de publicación desde el browser. La usan el panel de admin y
 * el cuadro para publicar del feed.
 *
 * El bucket no deja escribir en `boletin/` desde el browser: el servidor firma
 * una subida de un solo uso y arma la ruta (ver `prepararSubidaImagen`), y acá
 * se sube directo a Storage con ese token.
 *
 * POR QUÉ XMLHttpRequest Y NO `supabase.storage.uploadToSignedUrl`
 *
 * Porque hace falta la BARRA DE PROGRESO. supabase-js sube con `fetch`, y
 * `fetch` no expone el progreso de subida (no hay evento de bytes enviados;
 * los streams de request tampoco están disponibles en todos los browsers). El
 * único que lo da es `xhr.upload.onprogress`. Lo que va abajo es exactamente
 * lo que arma `uploadToSignedUrl` —PUT a `/object/upload/sign/<bucket>/<ruta>`
 * con el token en la query y el archivo en un FormData bajo la clave vacía—,
 * con el evento de progreso enchufado.
 *
 * Sin esto la foto de 3 MB desde el celular era un spinner de "Subiendo foto…"
 * sin ninguna señal de si avanzaba o estaba colgado.
 */

/** 4 MB: entra sobrado para una foto de nota y no castiga al que sube desde el cel. */
export const MAX_FOTO_BYTES = 4 * 1024 * 1024;

export const MIME_FOTO = Object.keys(EXTENSION_POR_MIME);

/** Un año de caché: la ruta lleva timestamp, así que el archivo nunca cambia. */
const CACHE_CONTROL = "2678400";

export type FotoSubida = { ruta: string; url: string };

export async function subirFotoComunicado(
  file: File,
  /** 0 → 1. Se llama muchas veces durante la subida. */
  alAvanzar?: (progreso: number) => void
): Promise<FotoSubida | { error: string }> {
  if (!MIME_FOTO.includes(file.type)) {
    return { error: `${file.name}: formato no válido. Subí JPG, PNG o WebP.` };
  }
  if (file.size > MAX_FOTO_BYTES) {
    return { error: `${file.name}: supera los 4 MB. Probá con una más liviana.` };
  }

  const firma = await llamarAccion(() => prepararSubidaImagen(file.type));
  if (fallo(firma)) return { error: firma.error };

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const destino = `${base}/storage/v1/object/upload/sign/${BUCKET_BOLETIN}/${firma.ruta}?token=${encodeURIComponent(firma.token)}`;

  const cuerpo = new FormData();
  cuerpo.append("cacheControl", CACHE_CONTROL);
  // La clave vacía es la que espera Storage para el archivo.
  cuerpo.append("", file);

  const ok = await new Promise<boolean>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", destino);
    xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      // `lengthComputable` es false en algunos proxies: ahí no hay porcentaje
      // que mostrar y la barra se queda indeterminada.
      if (e.lengthComputable && alAvanzar) alAvanzar(e.loaded / e.total);
    };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.onabort = () => resolve(false);
    xhr.send(cuerpo);
  });

  if (!ok) return { error: `No pudimos subir ${file.name}. Intentá de nuevo.` };

  alAvanzar?.(1);
  return { ruta: firma.ruta, url: urlPublica(firma.ruta) };
}

/**
 * La URL pública de una ruta del bucket, armada a mano.
 *
 * Es una plantilla fija de Storage (`/object/public/<bucket>/<ruta>`) y así
 * este módulo no necesita un cliente de Supabase — que era el único motivo por
 * el que los componentes que suben fotos creaban uno.
 */
export function urlPublica(ruta: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_BOLETIN}/${ruta}`;
}
