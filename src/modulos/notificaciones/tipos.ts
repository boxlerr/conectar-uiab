/**
 * Tipos de las notificaciones, fuera de `acciones.ts`.
 *
 * `acciones.ts` es `"use server"`: todo lo que exporta se convierte en un
 * endpoint. Un `interface` se borra al compilar y por eso importarlo de ahí
 * técnicamente funciona, pero arrastra el archivo entero a la cadena de
 * dependencias de cualquier componente que sólo quiera el tipo. Acá no hay
 * nada que arrastrar.
 *
 * OJO al agregar un tipo nuevo: el `CHECK` de la tabla vive en producción y no
 * en ninguna migración del repo, así que hay que tocarlo a mano en Supabase
 * ANTES de que el código empiece a insertarlo. Además hay que sumarlo a los dos
 * `Record` de `campana-notificaciones.tsx` y al de `panel-notificaciones.tsx`,
 * o el ícono sale vacío.
 */
export type TipoNotificacion =
  | "resena_aprobada"
  | "resena_rechazada"
  | "resena_recibida"
  | "oportunidad_solicitud"
  | "solicitud_respondida"
  | "pago_confirmado"
  | "pago_fallido"
  | "suscripcion_por_vencer"
  | "suscripcion_en_mora"
  | "suscripcion_suspendida"
  | "etiquetas_precargadas";

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  leida: boolean;
  /** Puede ser `null`: `resena_rechazada` no manda a ningún lado. */
  url: string | null;
  creada_en: string;
}

/** Columnas exactas de la tabla. La de orden es `creada_en`, no `created_at`. */
export const SELECT_NOTIFICACION = "id, tipo, titulo, mensaje, leida, url, creada_en";

/** `"hace 3h"`. Corta en días, que es lo que se ve en una lista corta. */
export function tiempoRelativoNotificacion(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d}d`;
  return new Date(fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}
