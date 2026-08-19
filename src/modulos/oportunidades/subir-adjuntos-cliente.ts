"use client";

import { createClient } from "@/lib/supabase/cliente";
import { llamarAccion, fallo } from "@/lib/accion-segura";
import {
  confirmarSubidaAdjuntos,
  prepararSubidaAdjuntos,
} from "@/app/oportunidades/adjuntos-acciones";
import { BUCKET_ADJUNTOS } from "./adjuntos";

export interface ResultadoSubidaAdjuntos {
  subidos: number;
  /** Nombres de los archivos que no entraron, para contarle al usuario. */
  fallidos: string[];
  /** Error general (guard, validación) cuando no se subió nada. */
  error?: string;
}

/**
 * Sube archivos a una oportunidad del usuario: pide las URLs firmadas al
 * action (guard de dueño + validación) y sube directo del browser a Storage.
 *
 * Cada archivo corre con un timeout de 90s (mismo patrón que certificaciones:
 * `storage.upload` no tiene timeout propio y sin la carrera el botón quedaba
 * en "Guardando…" para siempre — bug real del 2026-08-04).
 */
export async function subirAdjuntosDeOportunidad(
  oportunidadId: string,
  archivos: File[]
): Promise<ResultadoSubidaAdjuntos> {
  if (archivos.length === 0) return { subidos: 0, fallidos: [] };

  const preparacion = await llamarAccion(() =>
    prepararSubidaAdjuntos(
      oportunidadId,
      archivos.map((archivo) => ({
        nombre: archivo.name,
        mime: archivo.type,
        tamano: archivo.size,
      }))
    )
  );

  if (fallo(preparacion)) {
    return {
      subidos: 0,
      fallidos: archivos.map((archivo) => archivo.name),
      error: preparacion.error,
    };
  }
  if (!preparacion.success || !preparacion.subidas) {
    return {
      subidos: 0,
      fallidos: archivos.map((archivo) => archivo.name),
      error: preparacion.error ?? "No se pudieron preparar las subidas.",
    };
  }

  const supabase = createClient();
  let subidos = 0;
  const fallidos: string[] = [];

  // Por índice, no por nombre: el action devuelve una firma por archivo en el
  // mismo orden en que se mandaron, y emparejar por nombre subiría dos veces el
  // mismo archivo si alguna vez llegan dos homónimos.
  for (const [indice, firma] of preparacion.subidas.entries()) {
    const archivo = archivos[indice];
    if (!archivo) continue;

    try {
      const subida = supabase.storage
        .from(BUCKET_ADJUNTOS)
        .uploadToSignedUrl(firma.ruta, firma.token, archivo, {
          contentType: archivo.type,
          // 31 días: la ruta es única por subida (timestamp en el nombre).
          cacheControl: "2678400",
        });
      const vencimiento = new Promise<never>((_, rechazar) =>
        setTimeout(() => rechazar(new Error("timeout")), 90_000)
      );
      const { error } = await Promise.race([subida, vencimiento]);
      if (error) throw error;
      subidos++;
    } catch (err) {
      console.error(`[adjuntos] Falló la subida de "${archivo.name}":`, err);
      fallidos.push(archivo.name);
    }
  }

  if (subidos > 0) {
    // Regenera el HTML del detalle (ISR 300s) para que salga con los archivos.
    // llamarAccion nunca rechaza, y si esto falla el revalidate de 300s alcanza.
    await llamarAccion(() => confirmarSubidaAdjuntos(oportunidadId));
  }

  return { subidos, fallidos };
}
