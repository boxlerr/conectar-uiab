"use server";

import { createClient } from "@/lib/supabase/servidor";
import { revalidatePath } from "next/cache";

export async function crearOportunidad(formData: FormData) {
  const supabase = await createClient();

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
    })
    .select('id')
    .single();

  if (insertError) {
    console.error("Error al publicar oportunidad:", insertError);
    return { success: false, error: "Ocurrió un error al guardar la oportunidad." };
  }

  // Insert tags (trigger recalculará los matches)
  if (tagIds.length > 0) {
    const tagRows = tagIds.map((tag_id) => ({
      oportunidad_id: newOp.id,
      tag_id,
      peso: 1,
    }));
    const { error: tagsError } = await supabase.from("oportunidades_tags").insert(tagRows);
    if (tagsError) {
      console.error("Error al guardar tags de oportunidad:", tagsError);
      // No abortamos: la oportunidad ya quedó creada; solo logueamos.
    }
  }

  // Revalidate cache paths
  revalidatePath("/oportunidades");
  revalidatePath("/dashboard");

  return { success: true, redirect: `/oportunidades/${newOp.id}` };
}
