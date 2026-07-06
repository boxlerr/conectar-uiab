import type { Metadata } from "next";

export const metadata: Metadata = {
  // default = título del listado /empresas; template = para las fichas hijas
  // /empresas/[slug], que conservan su " | UIAB Conecta".
  title: {
    default: "Empresas industriales socias de la UIAB",
    template: "%s | UIAB Conecta",
  },
  description:
    "Directorio de empresas industriales socias de la Unión Industrial de Almirante Brown: metalúrgicas, químicas, alimentarias, plásticos, autopartes y más. Perfiles verificados con contacto directo.",
  alternates: { canonical: "/empresas" },
  openGraph: {
    title: "Empresas industriales socias de la UIAB | UIAB Conecta",
    description:
      "Empresas industriales socias de la Unión Industrial de Almirante Brown. Perfiles verificados con contacto directo.",
    url: "https://www.uiabconecta.com/empresas",
    type: "website",
    siteName: "UIAB Conecta",
    locale: "es_AR",
  },
};

export default function EmpresasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
