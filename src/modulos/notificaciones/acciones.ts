"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/servidor";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface Notificacion {
  id: string;
  tipo: "resena_aprobada" | "resena_rechazada" | "resena_recibida";
  titulo: string;
  mensaje: string;
  leida: boolean;
  url: string | null;
  creada_en: string;
}

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
      .select("id, tipo, titulo, mensaje, leida, url, creada_en")
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
  } catch (err) {
    console.error("[notificaciones] Error marcando notificación como leída:", err);
  }
}
