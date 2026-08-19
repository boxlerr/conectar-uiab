"use server";

import { createClient } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolverEntidadDePerfil } from "@/modulos/autenticacion/entidad-del-perfil";
import { revalidatePath } from "next/cache";
import {
  crearEtiquetasLibres,
  filtrarEtiquetasLibres,
} from "@/modulos/oportunidades/etiquetas-libres";
import { parsearFormOportunidad } from "@/modulos/oportunidades/form-oportunidad";
import { recalcularMatchesDeOportunidad } from "@/modulos/oportunidades/calcular-matches";

export interface ResultadoCrearOportunidad {
  success: boolean;
  error?: string;
  redirect?: string;
  /** Recién creada: el formulario la necesita para subir los adjuntos. */
  oportunidadId?: string;
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

  // De qué ficha publica. Sale de la membresía real, no de `rol_sistema`:
  // ramificar en `'company' | 'provider'` dejaba afuera a los admin que además
  // son dueños de una empresa (el caso de Vaxler), que no caían en ninguna rama
  // y quedaban con las dos entidades en null: "no estás asociado a ninguna
  // empresa" teniendo la membresía cargada. Ver entidad-del-perfil.ts.
  const entidad = await resolverEntidadDePerfil(supabase, user.id);
  const empresaId = entidad?.tipo === "company" ? entidad.id : null;
  const proveedorId = entidad?.tipo === "provider" ? entidad.id : null;

  if (!empresaId && !proveedorId) {
    return { success: false, error: "No estás asociado a ninguna empresa o particular validado." };
  }

  // Parse Form Data (parser compartido con la edición)
  const parseado = parsearFormOportunidad(formData);
  if ("error" in parseado) return { success: false, error: parseado.error };
  const {
    titulo,
    descripcion,
    categoria_id,
    localidad,
    cantidad,
    unidad: unidadRaw,
    fecha_necesidad: fechaRaw,
    tipoRequerimiento,
    tagIds,
  } = parseado.campos;

  const visibilidad = (formData.get("visibilidad") as string) || "privada_parque";

  // Términos libres escritos por el usuario: limpiamos, validamos (mismo criterio
  // que las etiquetas del perfil), deduplicamos por slug y acotamos el total.
  const nuevasEtiquetas = filtrarEtiquetasLibres(parseado.campos.nuevasEtiquetas);

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

  // Términos libres → filas en `tags` (helper compartido con la edición).
  let tagIdsLibres: string[] = [];
  if (nuevasEtiquetas.length > 0) {
    const resultado = await crearEtiquetasLibres(createAdminClient(), nuevasEtiquetas, {
      userId: user.id,
      empresaId,
      proveedorId,
    });
    tagIdsLibres = resultado.ids;
    if (resultado.aviso) {
      avisoTags =
        "La oportunidad se publicó, pero algún término nuevo no se pudo guardar como etiqueta.";
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

  // Candidatos recomendados. Va DESPUÉS de las etiquetas a propósito: el
  // trigger viejo de `oportunidades_tags` borra los matches al insertarlas, así
  // que este recálculo tiene que ser lo último en tocar la tabla.
  await recalcularMatchesDeOportunidad(createAdminClient(), newOp.id);

  // Revalidate cache paths
  revalidatePath("/oportunidades");
  revalidatePath("/panel-de-control");

  return {
    success: true,
    redirect: `/oportunidades/${newOp.id}`,
    oportunidadId: newOp.id,
    avisoTags,
  };
}
