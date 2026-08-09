import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { crearSlug } from "@/lib/utilidades";

const BASE_URL = "https://www.uiabconecta.com";

/**
 * Fecha de la última reescritura de las páginas de contenido fijo (legales,
 * contacto, alta de socios).
 *
 * Antes todas las rutas estáticas llevaban `lastModified: new Date()`, o sea la
 * hora de la request: cada vez que Google leía el sitemap, las 11 páginas
 * decían haber cambiado hace un segundo. Un `lastmod` que siempre miente deja
 * de ser una señal — Google lo empieza a ignorar para todo el sitemap, incluidas
 * las fichas donde la fecha SÍ es real. Actualizar a mano cuando se edite el
 * texto de esas páginas.
 */
const ACTUALIZACION_PAGINAS_FIJAS = new Date("2026-08-09");

/**
 * El sitemap se prerenderiza, así que sin esto una socia recién aprobada no
 * entraba hasta el siguiente deploy. Con revalidación horaria se publica sola.
 */
export const revalidate = 3600;

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /**
   * Los listados llevan la fecha del alta más reciente que muestran: es la
   * única que cambia de verdad cuando cambia la página.
   */
  const construirEstaticas = (ultimaAlta: Date): MetadataRoute.Sitemap => [
    { url: `${BASE_URL}/`, lastModified: ultimaAlta, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/directorio`, lastModified: ultimaAlta, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/empresas`, lastModified: ultimaAlta, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/oportunidades`, lastModified: ultimaAlta, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/instituciones-bancarias`, lastModified: ultimaAlta, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/instituciones-educativas`, lastModified: ultimaAlta, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/cooperativas`, lastModified: ultimaAlta, changeFrequency: "weekly", priority: 0.7 },
    // Faltaban las dos: /sumate es la puerta de entrada de las socias nuevas y
    // /terminos la referencia legal a la que apuntan el registro y el checkout.
    { url: `${BASE_URL}/sumate`, lastModified: ACTUALIZACION_PAGINAS_FIJAS, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contacto`, lastModified: ACTUALIZACION_PAGINAS_FIJAS, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/terminos`, lastModified: ACTUALIZACION_PAGINAS_FIJAS, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacidad`, lastModified: ACTUALIZACION_PAGINAS_FIJAS, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/cookies`, lastModified: ACTUALIZACION_PAGINAS_FIJAS, changeFrequency: "yearly", priority: 0.3 },
    // /proveedores NO va: es un 308 a /empresas?categoria=proveedores
    // (ver next.config.ts). Publicar un redirect en el sitemap es pedirle a
    // Google que gaste rastreo en una URL que no existe más.
  ];

  try {
    const supabase = adminClient();

    const [{ data: empresas }, { data: proveedores }, { data: oportunidades }] =
      await Promise.all([
        supabase.from("empresas").select("razon_social, creado_en").eq("estado", "aprobada"),
        supabase.from("proveedores").select("razon_social, creado_en").eq("estado", "aprobado"),
        supabase.from("oportunidades").select("id, creado_en").eq("estado", "abierta"),
      ]);

    const fecha = (v: string | null | undefined) => (v ? new Date(v) : ACTUALIZACION_PAGINAS_FIJAS);

    const empresaRoutes: MetadataRoute.Sitemap = (empresas ?? [])
      .filter((e) => e.razon_social)
      .map((e) => ({
        url: `${BASE_URL}/empresas/${crearSlug(e.razon_social)}`,
        lastModified: fecha(e.creado_en),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));

    /**
     * Las fichas de particulares también cuelgan de /empresas/[slug]: esa ruta
     * detecta el tipo de entidad y arma el layout que corresponda. Salían como
     * `/proveedores/<slug>`, que hoy es un 308 hacia acá — el sitemap publica
     * directamente el destino.
     */
    const proveedorRoutes: MetadataRoute.Sitemap = (proveedores ?? [])
      .filter((p) => p.razon_social)
      .map((p) => ({
        url: `${BASE_URL}/empresas/${crearSlug(p.razon_social)}`,
        lastModified: fecha(p.creado_en),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));

    const oportunidadRoutes: MetadataRoute.Sitemap = (oportunidades ?? [])
      .filter((o) => o.id)
      .map((o) => ({
        url: `${BASE_URL}/oportunidades/${o.id}`,
        lastModified: fecha(o.creado_en),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

    const fichas = [...empresaRoutes, ...proveedorRoutes];

    // Una empresa y un particular podrían compartir razón social y colapsar en
    // el mismo slug; el sitemap no debe repetir una URL.
    const unicas = new Map(fichas.map((r) => [r.url, r]));

    const ultimaAlta = fichas.reduce<Date>(
      (max, r) => (r.lastModified! > max ? (r.lastModified as Date) : max),
      ACTUALIZACION_PAGINAS_FIJAS
    );

    return [...construirEstaticas(ultimaAlta), ...unicas.values(), ...oportunidadRoutes];
  } catch {
    return construirEstaticas(ACTUALIZACION_PAGINAS_FIJAS);
  }
}
