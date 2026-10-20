import type { Metadata } from "next";
import { ConUsuarioDelServidor } from "@/modulos/autenticacion/usuario-del-servidor";

export const metadata: Metadata = {
  title: "Entidades educativas y centros de formación",
  description:
    "Universidades, institutos y centros de formación técnica aliados de la UIAB. Carreras, capacitaciones y articulación con la industria de Almirante Brown.",
  alternates: { canonical: "/instituciones-educativas" },
  openGraph: {
    title: "Entidades educativas y centros de formación | UIAB Conecta",
    description:
      "Centros de formación técnica aliados de la Unión Industrial de Almirante Brown, vinculados con la industria local.",
    url: "https://www.uiabconecta.com/instituciones-educativas",
    type: "website",
    siteName: "UIAB Conecta",
    locale: "es_AR",
  },
};

export default function InstitucionesEducativasLayout({ children }: { children: React.ReactNode }) {
  // Sigue dinámica a propósito: la socia ve el directorio y el visitante la
  // landing, y sin el usuario del servidor la socia vería la landing hasta que
  // hidrata. Ver ConUsuarioDelServidor.
  return <ConUsuarioDelServidor>{children}</ConUsuarioDelServidor>;
}
