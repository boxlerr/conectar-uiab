/**
 * Lecturas para páginas ISR: si Supabase falla, TIRAR. Nunca devolver vacío.
 *
 * En una página dinámica, tragar el error y devolver [] es lo correcto: la
 * página se degrada en ESE request y el siguiente ya sale bien (es el criterio
 * del incidente del 2026-08-15). En una página ISR es lo contrario: lo que
 * devuelve el render queda cacheado en el CDN hasta el próximo `revalidate`.
 * Pasó el 2026-10-20, a minutos de salir el ISR: un timeout de Supabase durante
 * una revalidación dejó /rubros cacheado con "0 EMPRESAS" en todos los rubros.
 * En una ficha era peor: sin la fila, `notFound()` cacheaba un 404 y la
 * metadata un "Perfil no encontrado" con noindex.
 *
 * Si el render TIRA, Next no cachea nada: en una revalidación sigue sirviendo
 * la versión anterior (la buena), y en el primer render el request da error y
 * el próximo vuelve a intentar.
 */
export function exigirDatos<T extends { error: { message: string } | null }>(res: T, que: string): T {
  if (res.error) {
    throw new Error(`[isr] no se pudo leer ${que}: ${res.error.message}`);
  }
  return res;
}
