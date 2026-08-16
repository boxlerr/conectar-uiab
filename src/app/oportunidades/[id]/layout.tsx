import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { ogPorRuta } from "@/lib/seo/og";
import { cortarEnPalabra, TOPE_TITLE_SIN_SUFIJO } from "@/lib/seo/texto";

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

  type FilaSeo = {
    estado: string;
    titulo: string | null;
    descripcion: string | null;
    localidad: string | null;
    categoria: { nombre: string } | null;
  };

  let op: FilaSeo | null = null;
  let baseCaida = false;
  if (pareceUuid) {
    try {
      const db = createAdminClient();
      const { data } = await db
        .from("oportunidades")
        .select("estado, titulo, descripcion, localidad, categoria:categorias(nombre)")
        .eq("id", id)
        .maybeSingle();
      // El join anidado hace que supabase-js infiera `categoria` como array:
      // el cast va vía unknown, igual que en el resto de las consultas del repo.
      op = data as unknown as FilaSeo | null;
    } catch {
      // Si la base no contesta, no marcamos noindex: preferimos no desindexar
      // una oportunidad real por un hipo de red.
      baseCaida = true;
    }
  }

  // Sólo las abiertas son contenido público indexable. Una cerrada sigue
  // siendo accesible para quien tenga el link, pero no debe entrar al índice.
  if (op?.estado !== "abierta") {
    if (baseCaida) return { alternates: { canonical: `/oportunidades/${id}` } };
    return {
      title: { absolute: "Oportunidad no disponible | UIAB Conecta" },
      robots: { index: false, follow: true },
      alternates: { canonical: `/oportunidades/${id}` },
    };
  }

  /**
   * TITLE y DESCRIPTION propios. Sin esto, todas las abiertas compartían la
   * metadata del listado (title, description y og:url de /oportunidades): N
   * resultados idénticos en Google y la tarjeta equivocada al compartir el
   * link por WhatsApp. La descripcion viene como HTML del editor: se aplana.
   */
  const titulo = cortarEnPalabra(op.titulo ?? "Oportunidad abierta", TOPE_TITLE_SIN_SUFIJO);
  const textoPlano = (op.descripcion ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
  const contexto = [op.categoria?.nombre, op.localidad].filter(Boolean).join(", ");
  const description = cortarEnPalabra(
    `Pedido abierto en la cartelera UIAB${contexto ? ` (${contexto})` : ""}: ${textoPlano}`,
    158
  );

  return {
    title: titulo,
    description,
    alternates: { canonical: `/oportunidades/${id}` },
    ...ogPorRuta(titulo, description, `/oportunidades/${id}`),
  };
}

export default function OportunidadDetalleLayout({ children }: { children: ReactNode }) {
  return children;
}
