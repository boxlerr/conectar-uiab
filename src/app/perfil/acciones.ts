"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { crearSlug } from "@/lib/utilidades";

// Server Action strictly bypassing RLS (if needed) for Profile Syncing using the Service Role Key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseSupabaseError(msg: string | undefined | null): string {
  if (!msg) return "Ocurrió un error desconocido al comunicarse con el servidor.";
  const lowerMsg = msg.toLowerCase();
  
  if (lowerMsg.includes("not-null constraint") || lowerMsg.includes("null value")) {
    return "Parece que olvidaste completar un campo fundamental del perfil. Revisa tus datos.";
  }
  if (lowerMsg.includes("duplicate key") || lowerMsg.includes("unique constraint")) {
    return `Uno de los datos que ingresaste (como tu Razón Social o CUIT) ya está registrado en el sistema. Detalles: ${msg}`;
  }
  if (lowerMsg.includes("schema cache") || lowerMsg.includes("column")) {
    return "El sistema está experimentando ajustes y hubo un problema de sincronización temporal. Intenta de nuevo en unos minutos.";
  }
  if (lowerMsg.includes("check constraint")) {
    return "Alguno de los formatos ingresados no es válido.";
  }
  return `Ocurrió un problema: ${msg}`;
}

export async function updateCompanyOrProvider(
  entityType: "company" | "provider",
  entityId: string | null | undefined,
  profileId: string,
  data: any
) {
  if (!entityType || !profileId) {
    return { error: "Identidad perdida o sesión expirada. Intenta iniciar sesión nuevamente." };
  }

  const table = entityType === "company" ? "empresas" : "proveedores";
  
  // Clean arbitrary UI states. Convert empty strings to null for optional database fields
  const safeData = { ...data };
  for (const key in safeData) {
    if (safeData[key] === "") {
      safeData[key] = null;
    }
  }

  try {
    if (!entityId) {
    // CREATE MODE - For users without an entity link
    const { data: newRow, error: insertError } = await supabaseAdmin
      .from(table)
      .insert(safeData)
      .select()
      .single();

    if (insertError || !newRow?.id) {
      console.error(`[Admin Insert Error]:`, insertError?.message);
      return { error: parseSupabaseError(insertError?.message) };
    }

    // Link member
    const memberTable = entityType === "company" ? "miembros_empresa" : "miembros_proveedor";
    const memberRefKey = entityType === "company" ? "empresa_id" : "proveedor_id";
    
    const { error: memberError } = await supabaseAdmin.from(memberTable).insert({
       [memberRefKey]: newRow.id,
       perfil_id: profileId,
       rol: 'gestor',
       es_principal: true
    });

    if (memberError) {
      console.error(`[Admin Member Insert Error]:`, memberError.message);
      return { error: parseSupabaseError(memberError.message) };
    }

    return { success: true, newEntityId: newRow.id };

  } else {
    // UPDATE MODE
    const { error } = await supabaseAdmin
      .from(table)
      .update(safeData)
      .eq('id', entityId);

    if (error) {
      console.error(`[Admin Update Error]:`, error.message);
      return { error: parseSupabaseError(error.message) };
    }

    return { success: true };
  }
  } catch (err: any) {
    console.error(`[Admin Action Catch Error]:`, err);
    return { error: parseSupabaseError(err?.message) };
  }
}

export async function saveCategories(
  entityType: "company" | "provider",
  entityId: string,
  categoryIds: string[]
) {
  if (!entityId || !entityType) {
    return { error: "Missing identity" };
  }

  const isCompany = entityType === "company";
  const relationTable = isCompany ? "empresas_categorias" : "proveedores_categorias";
  const relationKey = isCompany ? "empresa_id" : "proveedor_id";

  // First, wipe existing relationships to avoid duplicates and handle deletions
  await supabaseAdmin
    .from(relationTable)
    .delete()
    .eq(relationKey, entityId);

  if (categoryIds.length > 0) {
    // Generate new payload for massive insertion
    const payload = categoryIds.map((catId) => ({
      [relationKey]: entityId,
      categoria_id: catId,
    }));

    const { error: insertError } = await supabaseAdmin
      .from(relationTable)
      .insert(payload);

    if (insertError) {
      console.error(`[Category Save Error]:`, insertError.message);
      return { error: insertError.message };
    }
  }

  return { success: true };
}
