import type { Metadata } from "next";

// Formulario de edición (requiere ser dueño): no debe indexarse.
export const metadata: Metadata = {
  title: "Editar oportunidad",
  robots: { index: false, follow: false },
};

export default function EditarOportunidadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
