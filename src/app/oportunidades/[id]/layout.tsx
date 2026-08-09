import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Canonical propio para cada oportunidad.
 *
 * La página del detalle es un `"use client"`, así que no puede exportar
 * `metadata` y heredaba la del layout de la sección — o sea que las N
 * oportunidades declaraban todas `/oportunidades` como su versión canónica y se
 * plegaban contra el listado. Un layout sí puede resolverla por `params`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { alternates: { canonical: `/oportunidades/${id}` } };
}

export default function OportunidadDetalleLayout({ children }: { children: ReactNode }) {
  return children;
}
