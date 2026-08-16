import { createAdminClient } from "@/lib/supabase/admin";
import type { Oportunidad } from "@/modulos/oportunidades/servicio-oportunidades";
import { SELECT_OPORTUNIDAD } from "@/modulos/oportunidades/solicitante";
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
  return <OportunidadDetalleCliente id={id} inicial={await oportunidadAbierta(id)} />;
}
