import { SITE_URL } from "./entidad";

/**
 * BreadcrumbList de schema.org.
 *
 * `grep -rn breadcrumb src/` no devolvía NADA en todo el repo antes de esto, y
 * es el único rich result que Google todavía muestra de forma consistente para
 * un directorio: en vez de la URL cruda, el resultado se ve como
 * `uiabconecta.com › Directorio › Vaxler`.
 *
 * Para el objetivo de marca eso cuenta doble: cada ficha que aparezca en
 * resultados muestra la jerarquía del sitio, no una URL suelta.
 *
 * REGLA: el marcado tiene que coincidir con una miga VISIBLE y con enlaces
 * reales. Marcado que el usuario no ve es riesgo de guidelines, y una miga sin
 * `<a>` no aporta rastreo — que es la mitad de para qué la ponemos. Por eso
 * este módulo exporta el JSON-LD y `<Breadcrumbs>` (en migas.tsx) renderiza lo
 * mismo en pantalla.
 */
export interface Miga {
  nombre: string;
  /** Ruta relativa ("/directorio"). La última miga puede no tener enlace. */
  href?: string;
}

export function jsonLdBreadcrumbs(migas: Miga[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: migas.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.nombre,
      // `item` sólo cuando hay destino: la spec pide que el último elemento
      // (la página actual) pueda ir sin él.
      ...(m.href ? { item: `${SITE_URL}${m.href}` } : {}),
    })),
  };
}
