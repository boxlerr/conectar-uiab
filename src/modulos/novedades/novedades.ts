/**
 * Catálogo de novedades y su clave de persistencia.
 *
 * Vive fuera de `acciones.ts` a propósito: ese archivo es `"use server"` y ahí
 * SÓLO pueden exportarse funciones async. Un helper sincrónico exportado desde
 * una server action no existe del lado del cliente y rompe el import en tiempo
 * de build (la app entera devuelve 500).
 */
export type NovedadId = "usuarios_empresa";

/** Clave dentro de `perfiles.tutoriales_vistos`, que es un mapa jsonb libre. */
export function claveNovedad(id: NovedadId): string {
  return `novedad_${id}`;
}
