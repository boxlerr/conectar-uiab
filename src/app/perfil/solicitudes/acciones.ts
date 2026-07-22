"use server";

import { createClient } from "@/lib/supabase/servidor";
import { revalidatePath } from "next/cache";
import { crearNotificacion } from "@/modulos/notificaciones/acciones";

/**
 * Marca una solicitud recibida como "vista". Solo válido si el usuario actual
 * es miembro de la entidad destino (la RLS de update se encarga de validarlo).
 * Idempotente: si ya está en un estado más avanzado, no la retrocede.
 */
export async function marcarSolicitudVista(solicitudId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const { data: sol } = await supabase
    .from("solicitudes_presupuesto")
    .select("id, estado, vista_en")
    .eq("id", solicitudId)
    .single();

  if (!sol) return { success: false, error: "Solicitud inexistente" };

  // Solo avanzar si sigue en "enviada"
  if (sol.estado !== "enviada") {
    return { success: true, skipped: true };
  }

  const { error } = await supabase
    .from("solicitudes_presupuesto")
    .update({ estado: "vista", vista_en: new Date().toISOString() })
    .eq("id", solicitudId);

  if (error) {
    console.error("[marcarSolicitudVista]", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/perfil/solicitudes");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Marca una solicitud como "respondida". En esta fase no se captura el texto
 * de la respuesta — solo se cambia el estado para que el origen sepa que
 * fue atendida y el destinatario la saque de la bandeja activa.
 */
export async function marcarSolicitudRespondida(solicitudId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const { data: sol } = await supabase
    .from("solicitudes_presupuesto")
    .select("id, estado, perfil_solicitante_id, oportunidad_id")
    .eq("id", solicitudId)
    .single();

  if (!sol) return { success: false, error: "Solicitud inexistente" };

  if (sol.estado === "cerrada" || sol.estado === "cancelada" || sol.estado === "respondida") {
    return { success: true, skipped: true };
  }

  const { error } = await supabase
    .from("solicitudes_presupuesto")
    .update({ estado: "respondida", respondida_en: new Date().toISOString() })
    .eq("id", solicitudId);

  if (error) {
    console.error("[marcarSolicitudRespondida]", error);
    return { success: false, error: error.message };
  }

  // Notificar al postulante que respondieron su solicitud (in-web)
  if (sol.perfil_solicitante_id) {
    await crearNotificacion({
      perfilId: sol.perfil_solicitante_id,
      tipo: "solicitud_respondida",
      titulo: "Respondieron tu solicitud",
      mensaje: "El destinatario respondió tu solicitud de presupuesto.",
      url: sol.oportunidad_id
        ? `/oportunidades/${sol.oportunidad_id}`
        : "/perfil/solicitudes",
    });
  }

  revalidatePath("/perfil/solicitudes");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Cierra una solicitud (el dueño considera terminado el intercambio).
 */
export async function cerrarSolicitud(solicitudId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const { error } = await supabase
    .from("solicitudes_presupuesto")
    .update({ estado: "cerrada", cerrada_en: new Date().toISOString() })
    .eq("id", solicitudId);

  if (error) {
    console.error("[cerrarSolicitud]", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/perfil/solicitudes");
  revalidatePath("/dashboard");
  return { success: true };
}
