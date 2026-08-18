import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ogPorRuta } from "@/lib/seo/og";

/**
 * Con `www`, igual que layout.tsx, robots.ts y sitemap.ts.
 *
 * Antes salía de `NEXT_PUBLIC_SITE_URL` con fallback al apex pelado, así que el
 * canonical de /oportunidades apuntaba a `https://uiabconecta.com/oportunidades`
 * — un dominio que redirige a www. Un canonical hacia una URL que redirige es
 * una señal contradictoria: Google tiene que elegir por su cuenta cuál es la
 * buena.
 */
const SITE_URL = "https://www.uiabconecta.com";
// PNG 1200×630, no el SVG del logo: WhatsApp/Facebook/X no renderizan SVG
// como imagen de tarjeta, así que compartir /oportunidades salía sin imagen.
const IMAGEN_URL = `${SITE_URL}/industrial-b2b-header.png`;

export const metadata: Metadata = {
  // "Licitaciones B2B en Almirante Brown" es además el title que Google ya
  // elegía mostrar cuando el nuestro ("Oportunidades y licitaciones…") se
  // pasaba del corte con el sufijo del template.
  title: "Licitaciones B2B en Almirante Brown",
  description:
    "Cartelera B2B de la Unión Industrial de Almirante Brown: pedidos de compra y contratación de empresas verificadas, con contacto directo y sin comisiones.",
  keywords: [
    "UIAB Conecta",
    "Unión Industrial Almirante Brown",
    "licitaciones B2B",
    "directorio industrial",
    "Almirante Brown",
    "empresas Almirante Brown",
    "proveedores de servicios industriales",
  ],
  alternates: {
    canonical: `${SITE_URL}/oportunidades`,
  },
  ...ogPorRuta(
    "Licitaciones B2B en Almirante Brown",
    "Red privada B2B con aval institucional UIAB. Acceso directo a licitaciones verificadas en Almirante Brown.",
    "/oportunidades"
  ),
};

export default function OportunidadesLayout({ children }: { children: ReactNode }) {
  /**
   * Sólo el `WebPage` de esta sección.
   *
   * Acá vivía también un nodo `Organization` propio, con `@id`
   * `https://uiabconecta.com/#organization` — distinto del que el layout raíz ya
   * emite en TODAS las páginas (`https://www.uiabconecta.com/#organizacion`).
   * Para Google eran dos organizaciones diferentes compitiendo por la misma
   * marca en la misma página, con dos logos distintos. Se queda una sola, la de
   * la raíz, y desde acá se la referencia por `@id`.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/oportunidades#webpage`,
        url: `${SITE_URL}/oportunidades`,
        name: "Oportunidades UIAB Conecta",
        description:
          "Licitaciones B2B verificadas con aval institucional UIAB.",
        inLanguage: "es-AR",
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: IMAGEN_URL,
        },
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organizacion` },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
