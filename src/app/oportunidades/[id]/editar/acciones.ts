"use server";

import { createClient } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { oportunidadSiEsPropia } from "@/modulos/oportunidades/guard-duena";
import {
  crearEtiquetasLibres,
  filtrarEtiquetasLibres,
} from "@/modulos/oportunidades/etiquetas-libres";
import { parsearFormOportunidad } from "@/modulos/oportunidades/form-oportunidad";
import { recalcularMatchesDeOportunidad } from "@/modulos/oportunidades/calcular-matches";

export interface ResultadoEditarOportunidad {
  success: boolean;
  error?: string;
  redirect?: string;
  avisoTags?: string;
}

/**
 * Actualiza una oportunidad del usuario. Mismo FormData que `crearOportunidad`
 * (parser compartido); las etiquetas se REEMPLAZAN por el set nuevo y el
 * trigger de la base recalcula los matches al reinsertarlas.
 */
export async function editarOportunidad(
  oportunidadId: string,
  formData: FormData
): Promise<ResultadoEditarOportunidad> {
  const guard = await oportunidadSiEsPropia(oportunidadId);
  if ("error" in guard) return { success: false, error: guard.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tenés que iniciar sesión." };

  const parseado = parsearFormOportunidad(formData);
  if ("error" in parseado) return { success: false, error: parseado.error };
  const { campos } = parseado;

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("oportunidades")
    .update({
      titulo: campos.titulo,
      descripcion: campos.descripcion,
      categoria_id: campos.categoria_id,
      localidad: campos.localidad,
      cantidad: campos.cantidad,
      unidad: campos.unidad,
      fecha_necesidad: campos.fecha_necesidad,
      tipo_requerimiento: campos.tipoRequerimiento,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", oportunidadId);

  if (updateError) {
    console.error("Error al editar oportunidad:", updateError);
    return { success: false, error: "Ocurrió un error al guardar los cambios." };
  }

  let avisoTags: string | undefined;

  // Términos libres nuevos → filas en `tags`.
  const nuevasEtiquetas = filtrarEtiquetasLibres(campos.nuevasEtiquetas);
  let tagIdsLibres: string[] = [];
  if (nuevasEtiquetas.length > 0) {
    const resultado = await crearEtiquetasLibres(admin, nuevasEtiquetas, {
      userId: user.id,
      empresaId: guard.op.empresa_solicitante_id,
      proveedorId: guard.op.proveedor_solicitante_id,
    });
    tagIdsLibres = resultado.ids;
    if (resultado.aviso) {
      avisoTags =
        "Se guardó, pero algún término nuevo no se pudo crear como etiqueta.";
    }
  }

  // Sincronización por diferencia, no "borrar todo y reinsertar".
  //
  // Con DELETE + INSERT, un solo tag_id inválido (una etiqueta que un admin
  // desactivó mientras el formulario estaba abierto) tumba el INSERT entero y
  // la oportunidad queda con CERO etiquetas — el peor resultado posible, porque
  // el cruce con la red queda ciego y el aviso decía sólo "no se pudieron
  // actualizar". Agregando primero y borrando después, un fallo deja las
  // etiquetas viejas intactas.
  const tagIdsFinal = new Set([...campos.tagIds, ...tagIdsLibres]);

  const { data: tagsActuales, error: leerTagsError } = await admin
    .from("oportunidades_tags")
    .select("tag_id")
    .eq("oportunidad_id", oportunidadId);

  if (leerTagsError) {
    console.error("Error al leer tags de oportunidad:", leerTagsError);
    avisoTags = "Se guardó, pero no se pudieron actualizar las etiquetas.";
  } else {
    const actuales = new Set((tagsActuales ?? []).map((fila) => fila.tag_id as string));
    const aAgregar = [...tagIdsFinal].filter((tagId) => !actuales.has(tagId));
    const aQuitar = [...actuales].filter((tagId) => !tagIdsFinal.has(tagId));

    if (aAgregar.length > 0) {
      const { error: insertError } = await admin.from("oportunidades_tags").insert(
        aAgregar.map((tag_id) => ({ oportunidad_id: oportunidadId, tag_id, peso: 1 }))
      );
      if (insertError) {
        console.error("Error al agregar tags de oportunidad:", insertError);
        avisoTags =
          "Se guardaron los cambios, pero las etiquetas quedaron como estaban.";
      }
    }

    // Sólo se quitan si lo nuevo entró: nunca dejamos la oportunidad sin ninguna.
    if (!avisoTags && aQuitar.length > 0) {
      const { error: deleteError } = await admin
        .from("oportunidades_tags")
        .delete()
        .eq("oportunidad_id", oportunidadId)
        .in("tag_id", aQuitar);
      if (deleteError) {
        console.error("Error al quitar tags de oportunidad:", deleteError);
        avisoTags = "Se guardó, pero alguna etiqueta que quitaste sigue asociada.";
      }
    }
  }

  // Las etiquetas cambiaron: el cruce se rehace con el criterio nuevo (y de
  // paso repone lo que el trigger viejo haya borrado al tocar la tabla).
  await recalcularMatchesDeOportunidad(admin, oportunidadId);

  revalidatePath(`/oportunidades/${oportunidadId}`);
  revalidatePath("/oportunidades");
  revalidatePath("/panel-de-control");

  return {
    success: true,
    redirect: `/oportunidades/${oportunidadId}`,
    avisoTags,
  };
}
