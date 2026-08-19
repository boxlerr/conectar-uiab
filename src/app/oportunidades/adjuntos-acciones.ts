"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { oportunidadSiEsPropia } from "@/modulos/oportunidades/guard-duena";
import { listarAdjuntosDeOportunidad } from "@/modulos/oportunidades/adjuntos-servidor";
import {
  type AdjuntoOportunidad,
  type ArchivoDeclarado,
  BUCKET_ADJUNTOS,
  MAX_ADJUNTOS,
  rutaParaAdjunto,
  validarAdjunto,
} from "@/modulos/oportunidades/adjuntos";

/**
 * Adjuntos de una oportunidad que NO es pública (cerrada), para su dueña.
 *
 * El RSC del detalle sólo resuelve adjuntos de las abiertas: mandarlos siempre
 * filtraría los planos de una cerrada a cualquiera que tenga el UUID. Esta es
 * la puerta con sesión para el caso que sí corresponde.
 */
export async function adjuntosDeOportunidadPropia(
  oportunidadId: string
): Promise<AdjuntoOportunidad[]> {
  const guard = await oportunidadSiEsPropia(oportunidadId);
  if ("error" in guard) return [];
  return listarAdjuntosDeOportunidad(oportunidadId);
}

export interface SubidaFirmada {
  /** Ruta del objeto dentro del bucket, para `uploadToSignedUrl`. */
  ruta: string;
  /** Token de un solo uso que autoriza la subida a esa ruta puntual. */
  token: string;
  /** Nombre original, para que el cliente empareje archivo ↔ firma. */
  nombre: string;
}

export interface ResultadoPrepararSubida {
  success: boolean;
  error?: string;
  subidas?: SubidaFirmada[];
}

/**
 * Firma URLs de subida para los adjuntos de una oportunidad del usuario.
 *
 * El archivo NUNCA pasa por acá (el body de un action corta en 4.5 MB en
 * Vercel): el cliente declara nombre/MIME/peso, esto valida y firma, y el
 * browser sube directo a Storage. El bucket además impone 10 MB y la whitelist
 * de MIME del lado del servidor de Storage, así que una declaración mentirosa
 * no pasa de ahí.
 */
export async function prepararSubidaAdjuntos(
  oportunidadId: string,
  archivos: ArchivoDeclarado[]
): Promise<ResultadoPrepararSubida> {
  const guard = await oportunidadSiEsPropia(oportunidadId);
  if ("error" in guard) return { success: false, error: guard.error };

  if (!Array.isArray(archivos) || archivos.length === 0) {
    return { success: false, error: "No hay archivos para subir." };
  }

  for (const archivo of archivos) {
    const invalido = validarAdjunto(archivo);
    if (invalido) return { success: false, error: invalido };
  }

  const existentes = await listarAdjuntosDeOportunidad(oportunidadId);
  if (existentes.length + archivos.length > MAX_ADJUNTOS) {
    return {
      success: false,
      error: `Una oportunidad admite hasta ${MAX_ADJUNTOS} archivos (ya tiene ${existentes.length}).`,
    };
  }

  const admin = createAdminClient();
  const subidas: SubidaFirmada[] = [];
  let orden = existentes.length + 1;

  for (const archivo of archivos) {
    const ruta = rutaParaAdjunto(oportunidadId, orden, archivo.nombre);
    const { data, error } = await admin.storage
      .from(BUCKET_ADJUNTOS)
      .createSignedUploadUrl(ruta);

    if (error || !data?.token) {
      console.error("[adjuntos] No se pudo firmar la subida:", error);
      return {
        success: false,
        error: "No se pudieron preparar las subidas. Probá de nuevo en un momento.",
      };
    }

    subidas.push({ ruta: data.path, token: data.token, nombre: archivo.nombre });
    orden++;
  }

  return { success: true, subidas };
}

export interface ResultadoEliminarAdjunto {
  success: boolean;
  error?: string;
}

/** Borra un adjunto puntual de una oportunidad del usuario. */
export async function eliminarAdjuntoDeOportunidad(
  oportunidadId: string,
  ruta: string
): Promise<ResultadoEliminarAdjunto> {
  const guard = await oportunidadSiEsPropia(oportunidadId);
  if ("error" in guard) return { success: false, error: guard.error };

  // La ruta tiene que ser de ESTA oportunidad: sin este check, un dueño
  // legítimo podría borrar objetos de cualquier otra carpeta del bucket.
  if (!ruta.startsWith(`${oportunidadId}/`) || ruta.includes("..")) {
    return { success: false, error: "Ruta de archivo inválida." };
  }

  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET_ADJUNTOS).remove([ruta]);
  if (error) {
    console.error("[adjuntos] No se pudo borrar:", error);
    return { success: false, error: "No se pudo borrar el archivo." };
  }

  revalidatePath(`/oportunidades/${oportunidadId}`);
  return { success: true };
}

/**
 * Avisa que terminó una tanda de subidas para regenerar el HTML del detalle.
 * Existe porque la subida en sí no pasa por ningún action (va directo del
 * browser a Storage) y sin esto el ISR de 300s seguiría sirviendo la página
 * sin los archivos recién subidos.
 */
export async function confirmarSubidaAdjuntos(
  oportunidadId: string
): Promise<{ success: boolean }> {
  const guard = await oportunidadSiEsPropia(oportunidadId);
  if ("error" in guard) return { success: false };
  revalidatePath(`/oportunidades/${oportunidadId}`);
  return { success: true };
}
