import type { Metadata } from "next";

/**
 * openGraph + twitter COMPLETOS por ruta.
 *
 * El merge de metadata de Next es superficial por clave de primer nivel: una
 * ruta que no declara `openGraph` hereda ENTERO el bloque del layout raíz —
 * og:title "UIAB Conecta | Directorio Industrial" y og:url apuntando a la
 * home—, así que compartir /directorio por WhatsApp mostraba la tarjeta de la
 * portada. Y una que declara `openGraph` pero no `twitter` hereda el twitter:*
 * rancio de la raíz. Por eso este helper devuelve los dos bloques juntos y
 * con todos los campos: url propia, imagen incluida.
 *
 * La imagen es un JPEG de 1200×630 REALES, generado para esto. Antes se
 * reusaba /industrial-b2b-header.png, que pese a la extensión es un JPEG
 * cuadrado de 1024×1024 y 810 KB: se declaraba 1200×630 sin serlo, así que
 * los scrapers lo recortaban solos (o lo descartaban por peso) y la tarjeta
 * salía distinta de lo declarado. Ese archivo sigue en uso como imagen
 * visible, donde next/image lo optimiza; acá no sirve.
 */
const SITE_URL = "https://www.uiabconecta.com";
const OG_IMAGE = {
  url: "/og-uiab-conecta.jpg",
  width: 1200,
  height: 630,
  alt: "UIAB Conecta — Directorio industrial de Almirante Brown",
};

export function ogPorRuta(
  titulo: string,
  descripcion: string,
  ruta: string
): Pick<Metadata, "openGraph" | "twitter"> {
  const tituloCompleto = titulo.includes("UIAB Conecta") ? titulo : `${titulo} | UIAB Conecta`;
  return {
    openGraph: {
      type: "website",
      siteName: "UIAB Conecta",
      locale: "es_AR",
      url: `${SITE_URL}${ruta}`,
      title: tituloCompleto,
      description: descripcion,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: tituloCompleto,
      description: descripcion,
      images: [OG_IMAGE.url],
    },
  };
}
