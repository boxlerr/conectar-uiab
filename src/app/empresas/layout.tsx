import type { Metadata } from "next";
import { ogPorRuta } from "@/lib/seo/og";

export const metadata: Metadata = {
  // default = título del listado /empresas; template = para las fichas hijas
  // /empresas/[slug], que conservan su " | UIAB Conecta".
  title: {
    default: "Empresas industriales socias de la UIAB",
    template: "%s | UIAB Conecta",
  },
  description:
    "Empresas industriales socias de la Unión Industrial de Almirante Brown: metalúrgicas, químicas, alimentarias, plásticos, autopartes y más, con contacto directo.",
  alternates: { canonical: "/empresas" },
  ...ogPorRuta(
    "Empresas industriales socias de la UIAB",
    "Empresas industriales socias de la Unión Industrial de Almirante Brown. Perfiles verificados con contacto directo.",
    "/empresas"
  ),
};

export default function EmpresasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
