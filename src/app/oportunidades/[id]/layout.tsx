import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Metadata por oportunidad.
 *
 * (1) CANONICAL. La página del detalle es un `"use client"`, así que no puede
 * exportar `metadata` y heredaba la del layout de la sección: las N
 * oportunidades declaraban todas `/oportunidades` como su versión canónica y se
 * plegaban contra el listado. Un layout sí puede resolverla por `params`.
 *
 * (2) NOINDEX PARA LAS QUE NO EXISTEN. Este era el agujero más grande de la
 * higiene del sitio: `/oportunidades/<cualquier-uuid>` devolvía 200, con
 * canonical propio autorreferencial y SIN noindex, sirviendo una página vacía.
 * O sea una fábrica infinita de URLs indexables con contenido idéntico — basta
 * con que una sola aparezca linkeada en cualquier lado para que Google empiece
 * a rastrear variantes.
 *
 * No alcanza con `notFound()`: en una ruta que streamea, el `notFound()` corre
 * después de que se mandó la cabecera y el status queda en 200 igual (es una
 * limitación conocida de App Router, no un bug de este repo). Por eso la
 * defensa que SÍ funciona es el `noindex` desde la metadata, que se resuelve
 * antes de renderizar: Google entra, lee la instrucción y descarta la URL.
 *
 * La consulta es una sola por id y sólo trae `id` y `estado`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  // Un id que no es UUID no puede existir: se descarta sin tocar la base.
  const pareceUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let existe = false;
  if (pareceUuid) {
    try {
      const db = createAdminClient();
      const { data } = await db
        .from("oportunidades")
        .select("id, estado")
        .eq("id", id)
        .maybeSingle();
      // Sólo las abiertas son contenido público indexable. Una cerrada sigue
      // siendo accesible para quien tenga el link, pero no debe entrar al índice.
      existe = data?.estado === "abierta";
    } catch {
      // Si la base no contesta, no marcamos noindex: preferimos no desindexar
      // una oportunidad real por un hipo de red.
      existe = true;
    }
  }

  if (!existe) {
    return {
      title: { absolute: "Oportunidad no disponible | UIAB Conecta" },
      robots: { index: false, follow: true },
      alternates: { canonical: `/oportunidades/${id}` },
    };
  }

  return { alternates: { canonical: `/oportunidades/${id}` } };
}

export default function OportunidadDetalleLayout({ children }: { children: ReactNode }) {
  return children;
}
