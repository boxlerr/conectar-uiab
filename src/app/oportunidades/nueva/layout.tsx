import type { Metadata } from "next";

// Formulario de creación (requiere sesión): no debe indexarse.
export const metadata: Metadata = {
  title: "Nueva oportunidad",
  robots: { index: false, follow: false },
};

export default function NuevaOportunidadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
