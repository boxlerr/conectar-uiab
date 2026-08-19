import { createAdminClient } from "@/lib/supabase/admin";
import type { Oportunidad } from "@/modulos/oportunidades/servicio-oportunidades";
import { SELECT_OPORTUNIDAD } from "@/modulos/oportunidades/solicitante";
import { listarAdjuntosDeOportunidad } from "@/modulos/oportunidades/adjuntos-servidor";
import OportunidadDetalleCliente from "./detalle-cliente";

/**
 * `/oportunidades/[id]` pasó a Server Component por la misma razón que el
 * listado: el contenido existía sólo después de hidratar.
 *
 * La página era un Client Component con todo detrás de `loading=true`, así que el
 * HTML del servidor era el spinner de "Cargando oportunidad..." — en una URL
 * que el sitemap publica por cada oportunidad abierta y cuya metadata la
 * declara indexable. Con cero abiertas nunca mordió; a la primera real,
 * Google iba a indexar un esqueleto.
 *
 * Acá se resuelve SÓLO lo público: la oportunidad si está abierta. Una
 * cerrada o inexistente baja como `null` y el cliente la busca con la sesión,
 * como siempre (una cerrada sigue siendo visible para quien tenga el link, y
 * su metadata ya la marca noindex desde el layout).
 */
export const revalidate = 300;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function oportunidadAbierta(id: string): Promise<Oportunidad | null> {
  // Un id que no es UUID no puede existir: se descarta sin tocar la base.
  if (!UUID.test(id)) return null;
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("oportunidades")
      .select(SELECT_OPORTUNIDAD)
      .eq("id", id)
      .eq("estado", "abierta")
      .maybeSingle();

    if (error || !data) return null;
    return data as unknown as Oportunidad;
  } catch {
    // Una caída de Supabase no puede tumbar la página: el cliente reintenta.
    return null;
  }
}

export default async function OportunidadDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inicial = await oportunidadAbierta(id);

  // Los adjuntos se resuelven acá SÓLO para una oportunidad abierta, que es
  // pública por definición (está en el sitemap y su HTML se sirve sin sesión).
  // Para el resto `inicial` es null y este payload viajaría igual al browser:
  // los nombres y las URLs de los planos de una oportunidad CERRADA quedarían
  // legibles con un curl al UUID. Esas las pide el cliente con sesión.
  const adjuntos = inicial ? await listarAdjuntosDeOportunidad(id) : [];

  return (
    <OportunidadDetalleCliente id={id} inicial={inicial} adjuntosIniciales={adjuntos} />
  );
}
