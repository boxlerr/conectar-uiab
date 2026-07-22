"use server";

import { createClient } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  limpiarNombreEtiqueta,
  slugEtiqueta,
  validarEtiquetaLibre,
} from "@/modulos/compartido/etiquetas";

/** Valores válidos de `oportunidades.tipo_requerimiento` (text[]) en la base. */
const TIPOS_REQUERIMIENTO_VALIDOS = ["material", "servicio", "personal", "otro"] as const;
/** Tope de términos libres que aceptamos por publicación. */
const MAX_NUEVAS_ETIQUETAS = 10;

export interface ResultadoCrearOportunidad {
  success: boolean;
  error?: string;
  redirect?: string;
  /** Se publicó, pero las etiquetas no se guardaron: hay que avisarle al usuario. */
  avisoTags?: string;
}

export async function crearOportunidad(
  formData: FormData
): Promise<ResultadoCrearOportunidad> {
  const supabase = await createClient();
  let avisoTags: string | undefined;

  // Validate Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Debes iniciar sesión para publicar una oportunidad." };
  }

  // Get Profile and Entity Information
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('id, rol_sistema')
    .eq('id', user.id)
    .single();

  if (perfilError || !perfil) {
    return { success: false, error: "No se encontró tu perfil de usuario." };
  }

  let empresaId = null;
  let proveedorId = null;

  if (perfil.rol_sistema === 'company') {
    const { data: m } = await supabase.from('miembros_empresa').select('empresa_id').eq('perfil_id', user.id).single();
    if (m) empresaId = m.empresa_id;
  } else if (perfil.rol_sistema === 'provider') {
    const { data: m } = await supabase.from('miembros_proveedor').select('proveedor_id').eq('perfil_id', user.id).single();
    if (m) proveedorId = m.proveedor_id;
  }

  if (!empresaId && !proveedorId) {
    return { success: false, error: "No estás asociado a ninguna empresa o particular validado." };
  }

  // Parse Form Data
  const titulo = (formData.get("titulo") as string)?.trim();
  const descripcion = (formData.get("descripcion") as string)?.trim();
  const categoria_id = formData.get("categoria_id") as string;
  const localidad = (formData.get("localidad") as string)?.trim();
  const visibilidad = (formData.get("visibilidad") as string) || "privada_parque";

  const cantidadRaw = formData.get("cantidad") as string | null;
  const unidadRaw = (formData.get("unidad") as string | null)?.trim() || null;
  const fechaRaw = (formData.get("fecha_necesidad") as string | null) || null;

  const cantidad = cantidadRaw && cantidadRaw.length > 0 ? Number(cantidadRaw) : null;
  if (cantidad !== null && (!Number.isFinite(cantidad) || cantidad < 0)) {
    return { success: false, error: "La cantidad debe ser un número válido." };
  }

  const tagIds = formData.getAll("tag_ids").map(String).filter(Boolean);

  // Qué necesita quien publica: material / servicio / personal / otro.
  const tipoRequerimiento = [
    ...new Set(formData.getAll("tipo_requerimiento").map(String)),
  ].filter((t): t is (typeof TIPOS_REQUERIMIENTO_VALIDOS)[number] =>
    (TIPOS_REQUERIMIENTO_VALIDOS as readonly string[]).includes(t)
  );

  // Términos libres escritos por el usuario: limpiamos, validamos (mismo criterio
  // que las etiquetas del perfil), deduplicamos por slug y acotamos el total.
  const nuevasEtiquetas: string[] = [];
  {
    const slugsVistos = new Set<string>();
    for (const raw of formData.getAll("nuevas_etiquetas")) {
      const nombre = limpiarNombreEtiqueta(String(raw));
      if (!nombre || validarEtiquetaLibre(nombre) !== null) continue;
      const slug = slugEtiqueta(nombre);
      if (!slug || slugsVistos.has(slug)) continue;
      slugsVistos.add(slug);
      nuevasEtiquetas.push(nombre);
      if (nuevasEtiquetas.length >= MAX_NUEVAS_ETIQUETAS) break;
    }
  }

  if (!titulo || !descripcion || !categoria_id || !localidad) {
    return { success: false, error: "Por favor completa todos los campos requeridos." };
  }

  // Insert to Database
  const { data: newOp, error: insertError } = await supabase
    .from("oportunidades")
    .insert({
      titulo,
      descripcion,
      categoria_id,
      localidad,
      visibilidad,
      estado: "abierta",
      creado_por: user.id,
      empresa_solicitante_id: empresaId,
      proveedor_solicitante_id: proveedorId,
      cantidad,
      unidad: unidadRaw,
      fecha_necesidad: fechaRaw,
      // Si no eligió ninguno, omitimos la columna para que rija su default.
      ...(tipoRequerimiento.length > 0 ? { tipo_requerimiento: tipoRequerimiento } : {}),
    })
    .select('id')
    .single();

  if (insertError) {
    console.error("Error al publicar oportunidad:", insertError);
    return { success: false, error: "Ocurrió un error al guardar la oportunidad." };
  }

  // Términos libres → filas en `tags`. Se hace con service role (saltea RLS,
  // igual que perfil/acciones::crearEtiquetaLibre) y se reutiliza la etiqueta si
  // ya existe por slug. Cada término tolera su propio error: la publicación ya
  // está hecha y no queremos abortarla por una etiqueta que no entró.
  const tagIdsLibres: string[] = [];
  if (nuevasEtiquetas.length > 0) {
    const admin = createAdminClient();
    for (const nombre of nuevasEtiquetas) {
      const slug = slugEtiqueta(nombre);
      try {
        const { data: existente } = await admin
          .from("tags")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (existente?.id) {
          tagIdsLibres.push(existente.id);
          continue;
        }

        const { data: creada, error: crearError } = await admin
          .from("tags")
          .insert({
            nombre,
            slug,
            tipo_tag: "general",
            activo: true,
            administrado_por_admin: false,
            creado_por: user.id,
            ...(empresaId ? { creado_por_empresa: empresaId } : {}),
            ...(proveedorId ? { creado_por_proveedor: proveedorId } : {}),
          })
          .select("id")
          .single();

        if (crearError) {
          // 23505: otra request creó el mismo slug entre el SELECT y el INSERT.
          if (crearError.code === "23505") {
            const { data: ganadora } = await admin
              .from("tags")
              .select("id")
              .eq("slug", slug)
              .maybeSingle();
            if (ganadora?.id) {
              tagIdsLibres.push(ganadora.id);
              continue;
            }
          }
          console.error("Error al crear etiqueta libre de oportunidad:", crearError);
          avisoTags =
            "La oportunidad se publicó, pero algún término nuevo no se pudo guardar como etiqueta.";
          continue;
        }

        if (creada?.id) tagIdsLibres.push(creada.id);
      } catch (err) {
        console.error("Error inesperado al crear etiqueta libre:", err);
        avisoTags =
          "La oportunidad se publicó, pero algún término nuevo no se pudo guardar como etiqueta.";
      }
    }
  }

  // Insert tags (trigger recalculará los matches)
  const tagIdsFinal = [...new Set([...tagIds, ...tagIdsLibres])];
  if (tagIdsFinal.length > 0) {
    const tagRows = tagIdsFinal.map((tag_id) => ({
      oportunidad_id: newOp.id,
      tag_id,
      peso: 1,
    }));
    const { error: tagsError } = await supabase.from("oportunidades_tags").insert(tagRows);
    if (tagsError) {
      console.error("Error al guardar tags de oportunidad:", tagsError);
      // No abortamos: la oportunidad ya quedó creada. Pero sí avisamos: sin
      // etiquetas el match queda ciego y el usuario no tendría cómo enterarse.
      avisoTags = "La oportunidad se publicó, pero no se pudieron guardar las etiquetas.";
    }
  }

  // Revalidate cache paths
  revalidatePath("/oportunidades");
  revalidatePath("/dashboard");

  return { success: true, redirect: `/oportunidades/${newOp.id}`, avisoTags };
}
