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
  const titulo = formData.get("titulo") as string;
  const descripcion = formData.get("descripcion") as string;
  const categoria_id = formData.get("categoria_id") as string;
  const localidad = formData.get("localidad") as string;
  const visibilidad = (formData.get("visibilidad") as string) || "privada_parque";
  
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
    })
    .select('id')
    .single();

  if (insertError) {
    console.error("Error al publicar oportunidad:", insertError);
    return { success: false, error: "Ocurrió un error al guardar la oportunidad." };
  }

  // Revalidate cache paths
  revalidatePath("/oportunidades");
  revalidatePath("/dashboard");

  return { success: true, redirect: `/oportunidades/${newOp.id}` };
}
