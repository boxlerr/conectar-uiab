import type { MetadataRoute } from "next";

const BASE_URL = "https://www.uiabconecta.com";

/**
 * Deja rastrear TODO el HTML del sitio. Lo que no debe indexarse se marca con
 * `noindex` (cabecera `X-Robots-Tag` en next.config.ts para las áreas privadas,
 * `metadata.robots` en el grupo (auth)), no con `Disallow`.
 *
 * Por qué al revés de lo obvio: `Disallow` bloquea el RASTREO, no la
 * indexación. Google nunca entra, nunca ve el `noindex`, y si la URL está
 * linkeada desde una página pública la lista igual — sin título ni descripción.
 * Es exactamente lo que pasó: `/register` está linkeado 7 veces desde la home y
 * las fichas, así que Search Console lo reportó como "Bloqueada por robots.txt"
 * (05/08/2026) en vez de descartarlo en silencio. El crawler TIENE que poder
 * entrar para enterarse de que no debe indexar.
 *
 * `/api/` es la única excepción: no devuelve HTML, no está linkeado desde
 * ninguna página y no tiene nada que Google pueda mostrar.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
