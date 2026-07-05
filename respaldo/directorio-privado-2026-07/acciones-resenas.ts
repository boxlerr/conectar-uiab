"use server";

import { createClient } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function crearResena(
  targetType: "empresa" | "proveedor",
  targetId: string,
  authorType: "company" | "provider",
  authorId: string,
  payload: {
    calificacion: number;
    comentario: string;
  }
) {
  if (!authorId) {
    return { error: "No se pudo identificar tu perfil. Volvé a iniciar sesión." };
  }

  // 1. Verificar sesión activa
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Sesión no válida. Por favor iniciá sesión nuevamente." };
  }

  // 2. Verificar que authorId pertenece al usuario autenticado
  const admin = createAdminClient();
  if (authorType === "company") {
    const { data: miembro } = await admin
      .from("miembros_empresa")
      .select("empresa_id")
      .eq("perfil_id", user.id)
      .eq("empresa_id", authorId)
      .single();
    if (!miembro) {
      return { error: "No tenés permisos para reseñar como esa empresa." };
    }
  } else {
    const { data: miembro } = await admin
      .from("miembros_proveedor")
      .select("proveedor_id")
      .eq("perfil_id", user.id)
      .eq("proveedor_id", authorId)
      .single();
    if (!miembro) {
      return { error: "No tenés permisos para reseñar como ese perfil particular." };
    }
  }

  // 3. Insertar con admin client (autorización ya validada arriba)
  const insertData: any = {
    calificacion: payload.calificacion,
    comentario: payload.comentario,
    estado: "pendiente_revision",
    creada_por: user.id,
  };

  if (targetType === "empresa") {
    insertData.empresa_resenada_id = targetId;
  } else {
    insertData.proveedor_resenado_id = targetId;
  }

  if (authorType === "company") {
    insertData.empresa_autora_id = authorId;
  } else {
    insertData.proveedor_autor_id = authorId;
  }

  const { error } = await admin.from("resenas").insert([insertData]);

  if (error) {
    console.error("Error al crear reseña:", error);
    return { error: error.message };
  }

  revalidatePath(`/empresas`);
  return { success: true };
}
