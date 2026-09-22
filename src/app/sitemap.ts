import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { crearSlug, nombreDeFichaParticular } from "@/lib/utilidades";
import { RUBROS_SEO } from "@/lib/datos/rubros-seo";
import { esNotaIndexable, rutaComunicado } from "@/modulos/boletin/formato";

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
    { url: `${BASE_URL}/rubros`, lastModified: ultimaAlta, changeFrequency: "weekly", priority: 0.8 },
    // Las 13 landings de rubro. Salen del array de src/lib/datos/rubros-seo.ts,
    // no de la tabla `categorias`: si se generaran solas, cualquier categoría
    // nueva se publicaría como URL indexable con una sola socia adentro.
    ...RUBROS_SEO.map((r) => ({
      url: `${BASE_URL}/rubros/${r.slug}`,
      lastModified: ultimaAlta,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    { url: `${BASE_URL}/nosotros`, lastModified: ACTUALIZACION_PAGINAS_FIJAS, changeFrequency: "monthly", priority: 0.8 },
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
    //
    // /boletin y sus notas se agregan abajo: su lastmod sale de la última
    // publicación, no del alta de una socia.
  ];

  try {
    const supabase = adminClient();

    const [{ data: empresas }, { data: proveedores }, { data: oportunidades }, { data: comunicados }] =
      await Promise.all([
        supabase.from("empresas").select("razon_social, creado_en, actualizado_en").eq("estado", "aprobada"),
        supabase
          .from("proveedores")
          .select("nombre, apellido, nombre_comercial, creado_en, actualizado_en")
          .eq("estado", "aprobado"),
        supabase.from("oportunidades").select("id, creado_en").eq("estado", "abierta"),
        supabase
          .from("comunicados")
          .select("id, titulo, cuerpo, publicado_en, actualizado_en")
          .eq("estado", "publicado"),
      ]);

    const fecha = (v: string | null | undefined) => (v ? new Date(v) : ACTUALIZACION_PAGINAS_FIJAS);

    /**
     * `lastmod` de una ficha = la más reciente entre alta y última edición.
     *
     * Antes usaba sólo `creado_en`, así que 50 de las 59 fichas declaraban no
     * haber cambiado desde el 2026-04-12 — cuando después se les cargaron
     * certificaciones, etiquetas y `es_socia_uiab`. Un lastmod que se queda
     * viejo es la instrucción explícita de "no vuelvas a pasar": Google baja la
     * frecuencia de rastreo justo de las páginas que sí cambiaron.
     *
     * Es el mismo principio que el comentario de arriba sobre las páginas
     * fijas, al revés: allá el lastmod mentía diciendo que TODO cambió recién;
     * acá mentía diciendo que NADA cambió nunca.
     */
    const ultimoCambio = (e: { creado_en?: string | null; actualizado_en?: string | null }) => {
      const c = fecha(e.creado_en);
      const a = e.actualizado_en ? new Date(e.actualizado_en) : null;
      return a && a > c ? a : c;
    };

    const empresaRoutes: MetadataRoute.Sitemap = (empresas ?? [])
      .filter((e) => e.razon_social)
      .map((e) => ({
        url: `${BASE_URL}/empresas/${crearSlug(e.razon_social)}`,
        lastModified: ultimoCambio(e),
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
      .map((p) => ({ p, nombre: nombreDeFichaParticular(p) }))
      // El slug TIENE que salir de la misma regla que usa /empresas/[slug].
      // Publicaba `crearSlug(razon_social)`, que es otro campo: la primera alta
      // con razón social distinta del nombre comercial habría entrado al
      // sitemap como una URL que da 404.
      .filter(({ nombre }) => nombre !== "")
      .map(({ p, nombre }) => ({
        url: `${BASE_URL}/empresas/${crearSlug(nombre)}`,
        lastModified: ultimoCambio(p),
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

    /**
     * Las notas del Boletín. Entran SÓLO las que pasan `esNotaIndexable`: un
     * aviso de dos líneas o una publicación que es sólo una foto se leen y se
     * comparten igual, pero publicarlas acá es pedirle a Google que indexe
     * páginas flacas — el problema que este sitio ya tiene con las fichas sin
     * descripción. Su página además va con `noindex`, así que listarlas sería
     * contradecirse.
     */
    const notas = (comunicados ?? []).filter((c) =>
      esNotaIndexable({ titulo: c.titulo ?? "", cuerpo: c.cuerpo ?? "" })
    );

    const notaRoutes: MetadataRoute.Sitemap = notas.map((c) => ({
      url: `${BASE_URL}${rutaComunicado({ id: c.id, titulo: c.titulo ?? "", cuerpo: c.cuerpo ?? "" })}`,
      lastModified: ultimoCambio({ creado_en: c.publicado_en, actualizado_en: c.actualizado_en }),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    // El índice de la sección cambia cuando cambia la nota más nueva.
    const ultimaNota = notaRoutes.reduce<Date>(
      (max, r) => ((r.lastModified as Date) > max ? (r.lastModified as Date) : max),
      ACTUALIZACION_PAGINAS_FIJAS
    );
    const boletinRoutes: MetadataRoute.Sitemap = [
      {
        url: `${BASE_URL}/boletin`,
        lastModified: ultimaNota,
        changeFrequency: "weekly",
        priority: 0.7,
      },
      ...notaRoutes,
    ];

    const fichas = [...empresaRoutes, ...proveedorRoutes];

    // Una empresa y un particular podrían compartir razón social y colapsar en
    // el mismo slug; el sitemap no debe repetir una URL.
    const unicas = new Map(fichas.map((r) => [r.url, r]));

    const ultimaAlta = fichas.reduce<Date>(
      (max, r) => (r.lastModified! > max ? (r.lastModified as Date) : max),
      ACTUALIZACION_PAGINAS_FIJAS
    );

    return [
      ...construirEstaticas(ultimaAlta),
      ...unicas.values(),
      ...oportunidadRoutes,
      ...boletinRoutes,
    ];
  } catch {
    return construirEstaticas(ACTUALIZACION_PAGINAS_FIJAS);
  }
}
