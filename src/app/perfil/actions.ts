"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Server Action strictly bypassing RLS (if needed) for Profile Syncing using the Service Role Key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updateCompanyOrProvider(
  entityType: "company" | "provider",
  entityId: string | null | undefined,
  profileId: string,
  data: any
) {
  if (!entityType || !profileId) {
    return { error: "Missing identity" };
  }

  const table = entityType === "company" ? "empresas" : "proveedores";
  
  // Clean arbitrary UI states
  const safeData = { ...data };
  
  if (!entityId) {
    // CREATE MODE - For users without an entity link
    const { data: newRow, error: insertError } = await supabaseAdmin
      .from(table)
      .insert(safeData)
      .select()
      .single();

    if (insertError || !newRow?.id) {
      console.error(`[Admin Insert Error]:`, insertError?.message);
      return { error: insertError?.message || "Failed to create entity" };
    }

    // Link member
    const memberTable = entityType === "company" ? "miembros_empresa" : "miembros_proveedor";
    const memberRefKey = entityType === "company" ? "empresa_id" : "proveedor_id";
    
    await supabaseAdmin.from(memberTable).insert({
       [memberRefKey]: newRow.id,
       perfil_id: profileId,
       rol: 'admin',
       es_principal: true
    });

    return { success: true, newEntityId: newRow.id };

  } else {
    // UPDATE MODE
    const { error } = await supabaseAdmin
      .from(table)
      .update(safeData)
      .eq('id', entityId);

    if (error) {
      console.error(`[Admin Update Error]:`, error.message);
      return { error: error.message };
    }

    return { success: true };
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
