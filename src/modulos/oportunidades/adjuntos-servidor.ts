import { createAdminClient } from "@/lib/supabase/admin";
import {
  type AdjuntoOportunidad,
  BUCKET_ADJUNTOS,
  esImagenAdjunto,
  nombreLegibleDeObjeto,
  urlPublicaDeAdjunto,
} from "./adjuntos";

/**
 * Lista los adjuntos de una oportunidad leyendo Storage (no hay tabla — ver el
 * comentario de cabecera de adjuntos.ts). Lo llaman el RSC del detalle y las
 * acciones del dueño; nunca un componente de browser (usa la service role).
 *
 * Tolerante a fallos: sin adjuntos, con el bucket caído o con Storage lento
 * devuelve `[]` — la página del detalle no puede depender de esto para pintar.
 */
export async function listarAdjuntosDeOportunidad(
  oportunidadId: string
): Promise<AdjuntoOportunidad[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(BUCKET_ADJUNTOS)
      .list(oportunidadId, { limit: 100 });

    if (error || !data) return [];

    return data
      .filter((objeto) => objeto.name && objeto.name !== ".emptyFolderPlaceholder")
      // El prefijo NN- del nombre codifica el orden de subida.
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((objeto) => {
        const ruta = `${oportunidadId}/${objeto.name}`;
        const mime =
          (objeto.metadata as { mimetype?: string } | null)?.mimetype ?? null;
        const tamano =
          (objeto.metadata as { size?: number } | null)?.size ?? null;
        return {
          ruta,
          nombre: nombreLegibleDeObjeto(objeto.name),
          url: urlPublicaDeAdjunto(ruta) ?? "",
          mime,
          tamano,
          esImagen: esImagenAdjunto(mime),
        };
      })
      .filter((adjunto) => adjunto.url);
  } catch {
    return [];
  }
}
