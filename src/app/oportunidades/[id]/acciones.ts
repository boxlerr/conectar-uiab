"use server";

import { createClient } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { notificarEntidad } from "@/modulos/notificaciones/acciones";
import { resolverEntidadDePerfil } from "@/modulos/autenticacion/entidad-del-perfil";
import { oportunidadSiEsPropia } from "@/modulos/oportunidades/guard-duena";
import { listarAdjuntosDeOportunidad } from "@/modulos/oportunidades/adjuntos-servidor";
import { BUCKET_ADJUNTOS } from "@/modulos/oportunidades/adjuntos";
import { SELECT_OPORTUNIDAD, solicitanteDe } from "@/modulos/oportunidades/solicitante";
import { recalcularMatchesDeOportunidad } from "@/modulos/oportunidades/calcular-matches";

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

  // 2) Ficha del candidato. Igual que en /oportunidades/nueva: la entidad sale
  // de la membresía real y no de `rol_sistema`, para que un admin con ficha
  // propia se postule con esa ficha en vez de rebotar. Ver entidad-del-perfil.ts.
  const entidad = await resolverEntidadDePerfil(supabase, user.id);
  const empresaOrigenId = entidad?.tipo === "company" ? entidad.id : null;
  const proveedorOrigenId = entidad?.tipo === "provider" ? entidad.id : null;

  if (!empresaOrigenId && !proveedorOrigenId) {
    return { success: false, error: "No estás asociado a una empresa o particular válido." };
  }

  // 3) Oportunidad + destino
  const { data: op, error: opError } = await supabase
    .from("oportunidades")
    .select("id, titulo, estado, empresa_solicitante_id, proveedor_solicitante_id")
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

  // 7b) Notificar a los miembros de la entidad destino (in-web, tolerante a fallos)
  const tituloOp = (op as { titulo?: string | null }).titulo?.trim();
  await notificarEntidad({
    empresaId: empresaDestinoId,
    proveedorId: proveedorDestinoId,
    tipo: "oportunidad_solicitud",
    titulo: "Nueva solicitud de presupuesto",
    mensaje: tituloOp
      ? `Recibiste una solicitud para "${tituloOp}".`
      : "Recibiste una nueva solicitud de presupuesto.",
    url: "/perfil/solicitudes",
  });

  // 8) Revalidar cachés
  revalidatePath(`/oportunidades/${oportunidadId}`);
  revalidatePath("/oportunidades");
  revalidatePath("/panel-de-control");

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

  // La misma entidad con la que se postula `postularseAOportunidad`: si acá se
  // resolviera distinto, el botón diría "postularte" sobre una postulación que
  // ya existe.
  const entidad = await resolverEntidadDePerfil(supabase, user.id);
  if (!entidad) return null;

  const col = entidad.tipo === "company" ? "empresa_origen_id" : "proveedor_origen_id";
  const val = entidad.id;

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

/* ═══════════════════════════════════════════════════════════════════════════
 * Acciones del DUEÑO — cerrar, eliminar, duplicar, invitar.
 *
 * Hasta el rediseño del detalle sólo el admin podía cerrar o eliminar una
 * oportunidad (modulos/admin/acciones.ts); la socia publicaba y no tenía más
 * control. Todas pasan por `oportunidadSiEsPropia` (guard real de membresía:
 * un action es un POST público).
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface ResultadoAccionDuena {
  success: boolean;
  error?: string;
  /** Sólo duplicar: adónde navegar después. */
  redirect?: string;
}

/** Marca la oportunidad como cerrada. No se borra nada: deja de aparecer en la
 *  cartelera y de aceptar postulaciones, pero el link directo sigue andando. */
export async function cerrarOportunidadPropia(
  oportunidadId: string
): Promise<ResultadoAccionDuena> {
  const guard = await oportunidadSiEsPropia(oportunidadId);
  if ("error" in guard) return { success: false, error: guard.error };

  if (guard.op.estado !== "abierta") {
    return { success: false, error: "La oportunidad ya está cerrada." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("oportunidades")
    .update({ estado: "cerrada", actualizado_en: new Date().toISOString() })
    .eq("id", oportunidadId);

  if (error) {
    console.error("[oportunidades] No se pudo cerrar:", error);
    return { success: false, error: "No se pudo cerrar la oportunidad." };
  }

  revalidatePath(`/oportunidades/${oportunidadId}`);
  revalidatePath("/oportunidades");
  revalidatePath("/panel-de-control");
  return { success: true };
}

/** Elimina la oportunidad y sus adjuntos de Storage. Irreversible. */
export async function eliminarOportunidadPropia(
  oportunidadId: string
): Promise<ResultadoAccionDuena> {
  const guard = await oportunidadSiEsPropia(oportunidadId);
  if ("error" in guard) return { success: false, error: guard.error };

  const admin = createAdminClient();

  // Primero los archivos: si el DELETE de la fila fallara después, quedan
  // huérfanos tolerables; al revés, la carpeta quedaría viva sin dueño posible.
  try {
    const adjuntos = await listarAdjuntosDeOportunidad(oportunidadId);
    if (adjuntos.length > 0) {
      await admin.storage
        .from(BUCKET_ADJUNTOS)
        .remove(adjuntos.map((adjunto) => adjunto.ruta));
    }
  } catch (err) {
    console.error("[oportunidades] No se pudieron borrar adjuntos:", err);
  }

  const { error } = await admin.from("oportunidades").delete().eq("id", oportunidadId);

  if (error) {
    console.error("[oportunidades] No se pudo eliminar:", error);
    return { success: false, error: "No se pudo eliminar la oportunidad." };
  }

  revalidatePath("/oportunidades");
  revalidatePath("/panel-de-control");
  return { success: true, redirect: "/oportunidades" };
}

/** Crea una copia abierta de la oportunidad (datos + etiquetas + adjuntos)
 *  para reutilizarla sin volver a cargar todo. */
export async function duplicarOportunidad(
  oportunidadId: string
): Promise<ResultadoAccionDuena> {
  const guard = await oportunidadSiEsPropia(oportunidadId);
  if ("error" in guard) return { success: false, error: guard.error };
  const { op } = guard;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tenés que iniciar sesión." };

  const admin = createAdminClient();
  const { data: copia, error: insertError } = await admin
    .from("oportunidades")
    .insert({
      titulo: op.titulo,
      descripcion: op.descripcion,
      categoria_id: op.categoria_id,
      localidad: op.localidad,
      visibilidad: op.visibilidad,
      estado: "abierta",
      creado_por: user.id,
      empresa_solicitante_id: op.empresa_solicitante_id,
      proveedor_solicitante_id: op.proveedor_solicitante_id,
      cantidad: op.cantidad,
      unidad: op.unidad,
      fecha_necesidad: op.fecha_necesidad,
      ...(op.tipo_requerimiento && op.tipo_requerimiento.length > 0
        ? { tipo_requerimiento: op.tipo_requerimiento }
        : {}),
    })
    .select("id")
    .single();

  if (insertError || !copia) {
    console.error("[oportunidades] No se pudo duplicar:", insertError);
    return { success: false, error: "No se pudo duplicar la oportunidad." };
  }

  // Etiquetas: el trigger de la base recalcula los matches al insertarlas.
  const { data: tagsOriginales } = await admin
    .from("oportunidades_tags")
    .select("tag_id, peso")
    .eq("oportunidad_id", oportunidadId);

  if (tagsOriginales && tagsOriginales.length > 0) {
    const { error: tagsError } = await admin.from("oportunidades_tags").insert(
      tagsOriginales.map((tag) => ({
        oportunidad_id: copia.id,
        tag_id: tag.tag_id,
        peso: tag.peso,
      }))
    );
    if (tagsError) {
      console.error("[oportunidades] Tags de la copia no guardadas:", tagsError);
    }
  }

  // La copia arma su propia lista de candidatos (después de las etiquetas).
  await recalcularMatchesDeOportunidad(admin, copia.id);

  // Adjuntos: copia dentro del mismo bucket. Best effort — la copia ya existe
  // y el dueño puede resubir un archivo puntual que haya fallado.
  try {
    const adjuntos = await listarAdjuntosDeOportunidad(oportunidadId);
    for (const adjunto of adjuntos) {
      const nombreObjeto = adjunto.ruta.slice(oportunidadId.length + 1);
      await admin.storage
        .from(BUCKET_ADJUNTOS)
        .copy(adjunto.ruta, `${copia.id}/${nombreObjeto}`);
    }
  } catch (err) {
    console.error("[oportunidades] Adjuntos de la copia no copiados:", err);
  }

  revalidatePath("/oportunidades");
  revalidatePath("/panel-de-control");
  return { success: true, redirect: `/oportunidades/${copia.id}` };
}

export interface CandidatoAInvitar {
  empresaId?: string | null;
  proveedorId?: string | null;
}

/** Tope de invitaciones por llamada: el fan-out de `notificarEntidad` ya
 *  multiplica por miembro de cada ficha. */
const MAX_INVITACIONES = 10;

/**
 * Invita candidatos a cotizar: les manda una notificación con el link del
 * detalle. Usa el tipo `oportunidad_solicitud` (el canal "pasó algo con una
 * oportunidad") porque el CHECK de `notificaciones.tipo` está en la base y no
 * es ampliable desde el repo — ver memoria de drift de esquema.
 */
export async function invitarCandidatosAOportunidad(
  oportunidadId: string,
  candidatos: CandidatoAInvitar[]
): Promise<ResultadoAccionDuena> {
  const guard = await oportunidadSiEsPropia(oportunidadId);
  if ("error" in guard) return { success: false, error: guard.error };
  const { op } = guard;

  if (op.estado !== "abierta") {
    return { success: false, error: "Sólo se puede invitar con la oportunidad abierta." };
  }

  const admin = createAdminClient();

  // Sólo se puede invitar a quien el cruce ya sugirió para ESTA oportunidad.
  // Sin este filtro, el action acepta cualquier UUID del padrón: quien publica
  // podría mandarle a toda la red una notificación con el título que escribió.
  const { data: sugeridos } = await admin
    .from("oportunidades_matches")
    .select("empresa_candidata_id, proveedor_candidato_id")
    .eq("oportunidad_id", oportunidadId);

  const empresasSugeridas = new Set(
    (sugeridos ?? [])
      .map((fila) => fila.empresa_candidata_id as string | null)
      .filter((valor): valor is string => Boolean(valor))
  );
  const proveedoresSugeridos = new Set(
    (sugeridos ?? [])
      .map((fila) => fila.proveedor_candidato_id as string | null)
      .filter((valor): valor is string => Boolean(valor))
  );

  const vistos = new Set<string>();
  const validos = (Array.isArray(candidatos) ? candidatos : [])
    .filter((candidato) => {
      const empresaId = candidato.empresaId ?? null;
      const proveedorId = candidato.proveedorId ?? null;
      if (empresaId && !empresasSugeridas.has(empresaId)) return false;
      if (proveedorId && !proveedoresSugeridos.has(proveedorId)) return false;
      const clave = empresaId ?? proveedorId;
      if (!clave || vistos.has(clave)) return false; // sin duplicar el fan-out
      vistos.add(clave);
      return true;
    })
    .slice(0, MAX_INVITACIONES);

  if (validos.length === 0) {
    return { success: false, error: "Elegí al menos un candidato sugerido para invitar." };
  }

  const solicitante = solicitanteDe(
    (await admin
      .from("oportunidades")
      .select(SELECT_OPORTUNIDAD)
      .eq("id", oportunidadId)
      .maybeSingle()).data ?? {}
  );

  for (const candidato of validos) {
    await notificarEntidad({
      empresaId: candidato.empresaId ?? null,
      proveedorId: candidato.proveedorId ?? null,
      tipo: "oportunidad_solicitud",
      titulo: "Te invitaron a cotizar",
      mensaje: `${solicitante.nombre ?? "Una socia de la red"} te invita a cotizar "${op.titulo}".`,
      url: `/oportunidades/${oportunidadId}`,
    });
  }

  return { success: true };
}
