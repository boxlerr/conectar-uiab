import type { Metadata } from "next";
import { ConUsuarioDelServidor } from "@/modulos/autenticacion/usuario-del-servidor";

export const metadata: Metadata = {
  title: "Entidades financieras aliadas — Banca PyME",
  description:
    "Bancos y entidades financieras aliadas de UIAB Conecta: líneas de crédito, financiación y productos para las PyMEs e industrias de Almirante Brown.",
  alternates: { canonical: "/instituciones-bancarias" },
  openGraph: {
    title: "Entidades financieras aliadas | UIAB Conecta",
    description:
      "Bancos y financieras aliadas de la Unión Industrial de Almirante Brown. Crédito y financiación para PyMEs industriales.",
    url: "https://www.uiabconecta.com/instituciones-bancarias",
    type: "website",
    siteName: "UIAB Conecta",
    locale: "es_AR",
  },
};

export default function InstitucionesBancariasLayout({ children }: { children: React.ReactNode }) {
  // Sigue dinámica a propósito: la socia ve el directorio y el visitante la
  // landing, y sin el usuario del servidor la socia vería la landing hasta que
  // hidrata. Ver ConUsuarioDelServidor.
  return <ConUsuarioDelServidor>{children}</ConUsuarioDelServidor>;
}
