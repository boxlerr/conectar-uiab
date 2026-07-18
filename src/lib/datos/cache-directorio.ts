import type { Entidad } from "@/lib/datos/directorio";

/**
 * ─── Cache SWR (stale-while-revalidate) para los directorios del cliente ───
 *
 * Las páginas `/empresas`, `/cooperativas`, `/instituciones-bancarias` e
 * `/instituciones-educativas` son Client Components que hacen fetch a
 * `vista_directorio` en cada mount y en cada "atrás" (popstate). Eso hacía
 * que volver a una página ya vista mostrara el skeleton de nuevo y re-pidiera
 * al servidor.
 *
 * Este store en memoria (a nivel módulo, vive mientras dura la sesión del SPA;
 * se limpia al recargar la pestaña) permite el patrón que usan las apps serias:
 *   1. Al entrar/volver: si hay datos cacheados → mostrarlos AL INSTANTE (sin
 *      skeleton).
 *   2. En segundo plano: revalidar en silencio y actualizar si cambió.
 *
 * Es 100% cliente: sólo se lee/escribe dentro de effects/callbacks, nunca
 * durante el render, así que no puede romper la hidratación. No importa
 * `server-only` ni lleva `"use client"` (es un módulo de datos puro).
 */
type EntradaCache = { data: Entidad[]; at: number };

const store = new Map<string, EntradaCache>();

/** Devuelve los datos cacheados para `key`, o null si nunca se cargaron. */
export function leerCacheDirectorio(key: string): Entidad[] | null {
  return store.get(key)?.data ?? null;
}

/** Guarda/actualiza los datos cacheados para `key`. */
export function guardarCacheDirectorio(key: string, data: Entidad[]): void {
  store.set(key, { data, at: Date.now() });
}
