import { crearSlug } from "@/lib/utilidades";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  EL LINK A UNA FICHA PÚBLICA — una sola forma de armarlo
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `/empresas/[slug]` no guarda el slug en ninguna columna: lo recalcula al
 * vuelo y busca la fila cuyo slug coincida (ver `src/app/empresas/[slug]/page.tsx`).
 * El criterio no es el mismo para los dos tipos de ficha:
 *
 *   · empresas    → `crearSlug(razon_social)`               ← SÓLO la razón social
 *   · proveedores → `crearSlug(nombre_comercial || nombre + apellido)`
 *
 * Quien arme el link con otro campo manda a un 404. Pasaba en la tarjeta de
 * candidato de una oportunidad, que usaba `nombre_comercial || razon_social`:
 * de las 28 socias con nombre comercial cargado, 23 lo tienen distinto de la
 * razón social, así que "Ver perfil" caía en `notFound()` en la mayoría de las
 * fichas —Simonetta, Ormazabal y Genrod entre ellas, que son justo las tres
 * primeras candidatas de la única oportunidad abierta—.
 *
 * Por eso el armado vive acá y no suelto en cada pantalla: si algún día la
 * ruta resuelve por una columna `slug` real, se cambia en un solo lugar.
 */

/** Slug con el que `/empresas/[slug]` encuentra a una SOCIA. */
export function slugDeEmpresa(razonSocial: string | null | undefined): string | null {
  const nombre = razonSocial?.trim();
  return nombre ? crearSlug(nombre) : null;
}

/** Slug con el que `/empresas/[slug]` encuentra a un PRESTADOR. */
export function slugDeProveedor(proveedor: {
  nombre_comercial?: string | null;
  nombre?: string | null;
  apellido?: string | null;
} | null | undefined): string | null {
  if (!proveedor) return null;
  const visible =
    proveedor.nombre_comercial?.trim() ||
    [proveedor.nombre, proveedor.apellido].filter(Boolean).join(" ").trim();
  return visible ? crearSlug(visible) : null;
}

/**
 * Ficha de un candidato de oportunidad, sea socia o prestador.
 * Devuelve `null` cuando el join no trajo la contraparte (RLS) — quien llama
 * debe esconder el link en vez de mandar a `/empresas/null`.
 */
export function hrefFichaDeCandidato(candidato: {
  empresa?: { razon_social?: string | null } | null;
  proveedor?: {
    nombre_comercial?: string | null;
    nombre?: string | null;
    apellido?: string | null;
  } | null;
}): string | null {
  const slug = candidato.empresa
    ? slugDeEmpresa(candidato.empresa.razon_social)
    : slugDeProveedor(candidato.proveedor);
  return slug ? `/empresas/${slug}` : null;
}
