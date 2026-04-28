import type { Metadata } from "next";
import type { ReactNode } from "react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://uiabconecta.com";
const LOGO_URL = `${SITE_URL}/logo-uiab-conecta-header.svg`;

export const metadata: Metadata = {
  title: "Oportunidades UIAB Conecta | Licitaciones B2B en Almirante Brown",
  description:
    "Plataforma B2B de la Unión Industrial de Almirante Brown. Licitaciones verificadas, conexión directa entre empresas y particulares de la región, sin comisiones.",
  keywords: [
    "UIAB Conecta",
    "Unión Industrial Almirante Brown",
    "licitaciones B2B",
    "directorio industrial",
    "Almirante Brown",
    "empresas Almirante Brown",
    "particulares industriales",
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
  // JSON-LD: Organization + WebSite. Le permite a Google asociar el logo con
  // la marca y mostrarlo en el knowledge panel y resultados de búsqueda.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "UIAB Conecta",
        alternateName: "Unión Industrial de Almirante Brown — Conecta",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: LOGO_URL,
          width: 1612,
          height: 279,
        },
        description:
          "Plataforma de vinculación comercial B2B de la Unión Industrial de Almirante Brown.",
        areaServed: {
          "@type": "AdministrativeArea",
          name: "Almirante Brown, Buenos Aires, Argentina",
        },
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/oportunidades#webpage`,
        url: `${SITE_URL}/oportunidades`,
        name: "Oportunidades UIAB Conecta",
        description:
          "Licitaciones B2B verificadas con aval institucional UIAB.",
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: LOGO_URL,
        },
        isPartOf: {
          "@id": `${SITE_URL}/#organization`,
        },
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
