import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cooperativas de trabajo y producción",
  description:
    "Cooperativas de trabajo y producción de la red UIAB Conecta. Economía social e industrial de Almirante Brown, con perfiles verificados y contacto directo.",
  alternates: { canonical: "/cooperativas" },
  openGraph: {
    title: "Cooperativas de trabajo y producción | UIAB Conecta",
    description:
      "Cooperativas de trabajo y producción de la red de la Unión Industrial de Almirante Brown.",
    url: "https://www.uiabconecta.com/cooperativas",
    type: "website",
    siteName: "UIAB Conecta",
    locale: "es_AR",
  },
};

export default function CooperativasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
