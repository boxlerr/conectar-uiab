"use server";

import { createClient } from "@/lib/supabase/servidor";
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
  const supabase = await createClient();

  const insertData: any = {
    calificacion: payload.calificacion,
    comentario: payload.comentario,
    estado: "pendiente_revision", // Always goes to moderation first
  };

  // Determine Target
  if (targetType === "empresa") {
    insertData.empresa_resenada_id = targetId;
  } else {
    insertData.proveedor_resenado_id = targetId;
  }

  // Determine Author
  if (authorType === "company") {
    insertData.empresa_autora_id = authorId;
  } else {
    insertData.proveedor_autor_id = authorId;
  }

  const { error } = await supabase.from("resenas").insert([insertData]);

  if (error) {
    console.error("Error al crear reseña:", error);
    return { error: error.message };
  }

  return { success: true };
}
