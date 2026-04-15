"use server";

import { createClient } from "@/lib/supabase/servidor";
import { revalidatePath } from "next/cache";

export async function getUserItems(role: 'company' | 'provider', entityId: string) {
  const supabase = await createClient();
  const filterKey = role === 'company' ? 'empresa_id' : 'proveedor_id';

  // We fetch from the generic "items" table using the corresponding fk
  // Assuming basic fields: id, titulo, descripcion, precio, estado, creado_en
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq(filterKey, entityId)
    .order('creado_en', { ascending: false });

  if (error) {
    if (error.code === 'PGRST116') return []; // no rows
    // It might fail if "items" is not the correct table name or if there are RLS issues
    console.error("Error fetching items:", error);
    return [];
  }

  return data || [];
}

export async function createItem(
  role: 'company' | 'provider', 
  entityId: string, 
  itemData: { titulo: string; descripcion: string; precio?: number }
) {
  const supabase = await createClient();
  const foreignKey = role === 'company' ? { empresa_id: entityId } : { proveedor_id: entityId };

  const { error } = await supabase
    .from('items')
    .insert([{
      ...itemData,
      ...foreignKey,
      estado: 'activo'
    }]);

  if (error) {
    console.error("Error creating item:", error);
    return { error: error.message };
  }

  revalidatePath('/perfil/productos-servicios');
  return { success: true };
}

export async function updateItem(
  id: string,
  itemData: { titulo: string; descripcion: string; precio?: number }
) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('items')
    .update({
      ...itemData,
      actualizado_en: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error("Error updating item:", error);
    return { error: error.message };
  }

  revalidatePath('/perfil/productos-servicios');
  return { success: true };
}

export async function deleteItem(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting item:", error);
    return { error: error.message };
  }

  revalidatePath('/perfil/productos-servicios');
  return { success: true };
}
