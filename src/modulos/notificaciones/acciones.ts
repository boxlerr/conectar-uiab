"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/servidor";
import { revalidatePath } from "next/cache";
import { SELECT_NOTIFICACION, type Notificacion } from "./tipos";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * El tipo vive en `./tipos` para que un componente pueda importarlo sin
 * arrastrar este archivo `"use server"`. Se re-exporta para no romper a los
 * que ya lo importaban de acá (la campana del header, entre otros).
 */
export type { Notificacion, TipoNotificacion } from "./tipos";

/** Crea una notificación en la DB para un perfil dado (usa service role). */
export async function crearNotificacion(input: {
  perfilId: string;
  tipo: Notificacion["tipo"];
  titulo: string;
  mensaje: string;
  url?: string;
}) {
  const { error } = await adminClient()
    .from("notificaciones")
    .insert({
      perfil_id: input.perfilId,
      tipo: input.tipo,
      titulo: input.titulo,
      mensaje: input.mensaje,
      url: input.url ?? null,
    });
  if (error) {
    console.error("[notificaciones] Error creando notificación:", error.message);
  }
}

/**
 * Notifica a todos los miembros de una entidad (empresa o particular) resolviendo
 * sus perfil_id con el service role y haciendo fan-out con `crearNotificacion`.
 *
 * Tolerante a fallos: nunca lanza. Si algo falla, loguea y sigue, para no romper
 * el flujo llamador (webhook, cron, server action de postulación, etc.).
 */
export async function notificarEntidad(input: {
  empresaId?: string | null;
  proveedorId?: string | null;
  tipo: Notificacion["tipo"];
  titulo: string;
  mensaje: string;
  url?: string;
}) {
  try {
    const db = adminClient();

    let perfilIds: string[] = [];

    if (input.empresaId) {
      const { data: miembros } = await db
        .from("miembros_empresa")
        .select("perfil_id")
        .eq("empresa_id", input.empresaId);
      perfilIds = (miembros ?? []).map((m) => m.perfil_id);
    } else if (input.proveedorId) {
      const { data: miembros } = await db
        .from("miembros_proveedor")
        .select("perfil_id")
        .eq("proveedor_id", input.proveedorId);
      perfilIds = (miembros ?? []).map((m) => m.perfil_id);
    }

    for (const perfilId of perfilIds) {
      await crearNotificacion({
        perfilId,
        tipo: input.tipo,
        titulo: input.titulo,
        mensaje: input.mensaje,
        url: input.url,
      });
    }
  } catch (err) {
    console.error("[notificaciones] Error notificando entidad:", err);
  }
}

/** Obtiene las últimas 20 notificaciones del usuario autenticado. */
export async function obtenerNotificaciones(): Promise<{
  notificaciones: Notificacion[];
  sinLeer: number;
}> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { notificaciones: [], sinLeer: 0 };

    const { data, error } = await supabase
      .from("notificaciones")
      .select(SELECT_NOTIFICACION)
      .eq("perfil_id", user.id)
      .order("creada_en", { ascending: false })
      .limit(20);

    if (error) throw error;

    const notificaciones = (data ?? []) as Notificacion[];
    const sinLeer = notificaciones.filter((n) => !n.leida).length;
    return { notificaciones, sinLeer };
  } catch (err) {
    console.error("[notificaciones] Error obteniendo notificaciones:", err);
    return { notificaciones: [], sinLeer: 0 };
  }
}

/** Marca todas las notificaciones del usuario como leídas. */
export async function marcarTodasLeidas() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("perfil_id", user.id)
      .eq("leida", false);

    // El panel de control es un Server Component: sin esto, la lista y el
    // contador siguen mostrando lo viejo hasta un refresh duro. La campana del
    // header no lo necesita (es estado de cliente) pero tampoco le molesta.
    revalidatePath("/panel-de-control");
  } catch (err) {
    console.error("[notificaciones] Error marcando como leídas:", err);
  }
}

/** Marca una notificación específica como leída. */
export async function marcarLeida(notificacionId: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("id", notificacionId)
      .eq("perfil_id", user.id);

    revalidatePath("/panel-de-control");
  } catch (err) {
    console.error("[notificaciones] Error marcando notificación como leída:", err);
  }
}
