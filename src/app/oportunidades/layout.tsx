import type { Metadata } from "next";
import type { ReactNode } from "react";

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
const LOGO_URL = `${SITE_URL}/logo-uiab-conecta-header.svg`;

export const metadata: Metadata = {
  title: "Oportunidades UIAB Conecta | Licitaciones B2B en Almirante Brown",
  description:
    "Plataforma B2B de la Unión Industrial de Almirante Brown. Licitaciones verificadas, conexión directa entre empresas y proveedores de servicios de la región, sin comisiones.",
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
  openGraph: {
    type: "website",
    url: `${SITE_URL}/oportunidades`,
    title: "Oportunidades UIAB Conecta | Licitaciones B2B en Almirante Brown",
    description:
      "Red privada B2B con aval institucional UIAB. Acceso directo a licitaciones verificadas en Almirante Brown.",
    siteName: "UIAB Conecta",
    images: [
      {
        url: LOGO_URL,
        width: 1612,
        height: 279,
        alt: "Logo UIAB Conecta — Plataforma de vinculación comercial B2B",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oportunidades UIAB Conecta",
    description:
      "Licitaciones B2B verificadas por la Unión Industrial de Almirante Brown.",
    images: [LOGO_URL],
  },
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
          url: LOGO_URL,
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
