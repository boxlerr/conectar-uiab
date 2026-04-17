"use server";

import { createClient } from "@/lib/supabase/servidor";
import { revalidatePath } from "next/cache";

export interface PostularseResult {
  success: boolean;
  error?: string;
  solicitudId?: string;
}

/**
 * Envía una solicitud de presupuesto desde el candidato (empresa o proveedor logueado)
 * hacia el dueño de la oportunidad. Además actualiza el match correspondiente
 * a estado `rfq_enviada` para que desaparezca del listado de recomendados.
 */
export async function postularseAOportunidad(
  oportunidadId: string,
  mensaje: string,
  cantidad?: number | null,
  unidad?: string | null
): Promise<PostularseResult> {
  const supabase = await createClient();

  // 1) Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Debes iniciar sesión para postularte." };
  }

  if (!mensaje || mensaje.trim().length < 5) {
    return { success: false, error: "Contanos brevemente por qué sos el indicado (mínimo 5 caracteres)." };
  }

  // 2) Perfil y entidad del candidato
  const { data: perfil, error: perfilError } = await supabase
    .from("perfiles")
    .select("id, rol_sistema")
    .eq("id", user.id)
    .single();

  if (perfilError || !perfil) {
    return { success: false, error: "No se encontró tu perfil." };
  }

  let empresaOrigenId: string | null = null;
  let proveedorOrigenId: string | null = null;

  if (perfil.rol_sistema === "company") {
    const { data: m } = await supabase
      .from("miembros_empresa")
      .select("empresa_id")
      .eq("perfil_id", user.id)
      .single();
    if (m) empresaOrigenId = m.empresa_id;
  } else if (perfil.rol_sistema === "provider") {
    const { data: m } = await supabase
      .from("miembros_proveedor")
      .select("proveedor_id")
      .eq("perfil_id", user.id)
      .single();
    if (m) proveedorOrigenId = m.proveedor_id;
  } else {
    return { success: false, error: "Solo empresas y proveedores pueden postularse." };
  }

  if (!empresaOrigenId && !proveedorOrigenId) {
    return { success: false, error: "No estás asociado a una empresa o particular válido." };
  }

  // 3) Oportunidad + destino
  const { data: op, error: opError } = await supabase
    .from("oportunidades")
    .select("id, estado, empresa_solicitante_id, proveedor_solicitante_id")
    .eq("id", oportunidadId)
    .single();

  if (opError || !op) {
    return { success: false, error: "La oportunidad no existe o fue eliminada." };
  }

  if (op.estado !== "abierta") {
    return { success: false, error: "Esta oportunidad ya no está recibiendo postulaciones." };
  }

  // 4) Validar que no sea el dueño
  const esDueno =
    (empresaOrigenId && op.empresa_solicitante_id === empresaOrigenId) ||
    (proveedorOrigenId && op.proveedor_solicitante_id === proveedorOrigenId);

  if (esDueno) {
    return { success: false, error: "No podés postularte a tu propia oportunidad." };
  }

  const empresaDestinoId = op.empresa_solicitante_id ?? null;
  const proveedorDestinoId = op.proveedor_solicitante_id ?? null;

  if (!empresaDestinoId && !proveedorDestinoId) {
    return { success: false, error: "La oportunidad no tiene un destinatario válido." };
  }

  // 5) Anti-duplicado: ¿ya existe una solicitud del mismo origen a esta oportunidad?
  const origenFiltro = empresaOrigenId
    ? { col: "empresa_origen_id", val: empresaOrigenId }
    : { col: "proveedor_origen_id", val: proveedorOrigenId! };

  const { data: existente } = await supabase
    .from("solicitudes_presupuesto")
    .select("id, estado")
    .eq("oportunidad_id", oportunidadId)
    .eq(origenFiltro.col, origenFiltro.val)
    .in("estado", ["enviada", "vista", "respondida"])
    .maybeSingle();

  if (existente) {
    return { success: false, error: "Ya enviaste una solicitud para esta oportunidad." };
  }

  // 6) Insertar solicitud (RLS valida que sos miembro de la entidad origen)
  const cantidadSafe =
    typeof cantidad === "number" && Number.isFinite(cantidad) && cantidad >= 0 ? cantidad : null;
  const unidadSafe = unidad && unidad.trim().length > 0 ? unidad.trim() : null;

  const { data: solicitud, error: insertError } = await supabase
    .from("solicitudes_presupuesto")
    .insert({
      oportunidad_id: oportunidadId,
      empresa_origen_id: empresaOrigenId,
      proveedor_origen_id: proveedorOrigenId,
      empresa_destino_id: empresaDestinoId,
      proveedor_destino_id: proveedorDestinoId,
      perfil_solicitante_id: user.id,
      mensaje: mensaje.trim(),
      cantidad: cantidadSafe,
      unidad: unidadSafe,
      estado: "enviada",
    })
    .select("id")
    .single();

  if (insertError || !solicitud) {
    console.error("[postularse] insert error:", insertError);
    return {
      success: false,
      error: "No pudimos enviar tu postulación. Revisá tus datos de empresa/proveedor e intentá de nuevo.",
    };
  }

  // 7) Actualizar el match (si existe) a rfq_enviada
  const matchOrigen = empresaOrigenId
    ? { col: "empresa_candidata_id", val: empresaOrigenId }
    : { col: "proveedor_candidato_id", val: proveedorOrigenId! };

  const { error: matchError } = await supabase
    .from("oportunidades_matches")
    .update({ estado: "rfq_enviada" })
    .eq("oportunidad_id", oportunidadId)
    .eq(matchOrigen.col, matchOrigen.val);

  if (matchError) {
    // No crítico: la solicitud ya quedó registrada
    console.warn("[postularse] match state update fallo:", matchError.message);
  }

  // 8) Revalidar cachés
  revalidatePath(`/oportunidades/${oportunidadId}`);
  revalidatePath("/oportunidades");
  revalidatePath("/dashboard");

  return { success: true, solicitudId: solicitud.id };
}

/**
 * Chequea si el usuario actual ya envió una solicitud activa para esta oportunidad.
 * Se usa en la UI para mostrar "ya postulado" en lugar del botón.
 */
export async function miPostulacionEnOportunidad(
  oportunidadId: string
): Promise<{ id: string; estado: string } | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol_sistema")
    .eq("id", user.id)
    .single();

  if (!perfil) return null;

  let col: "empresa_origen_id" | "proveedor_origen_id";
  let val: string | null = null;

  if (perfil.rol_sistema === "company") {
    const { data: m } = await supabase
      .from("miembros_empresa")
      .select("empresa_id")
      .eq("perfil_id", user.id)
      .single();
    col = "empresa_origen_id";
    val = m?.empresa_id ?? null;
  } else if (perfil.rol_sistema === "provider") {
    const { data: m } = await supabase
      .from("miembros_proveedor")
      .select("proveedor_id")
      .eq("perfil_id", user.id)
      .single();
    col = "proveedor_origen_id";
    val = m?.proveedor_id ?? null;
  } else {
    return null;
  }

  if (!val) return null;

  const { data } = await supabase
    .from("solicitudes_presupuesto")
    .select("id, estado")
    .eq("oportunidad_id", oportunidadId)
    .eq(col, val)
    .order("enviada_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}
