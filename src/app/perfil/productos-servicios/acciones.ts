"use server";

import { createClient } from "@/lib/supabase/servidor";
import { revalidatePath } from "next/cache";

export type EnlaceItem = {
  tipo: "web" | "video" | "ficha" | "catalogo" | "otro";
  etiqueta: string;
  url: string;
};

export type ItemPayload = {
  nombre: string;
  tipo_item: "producto" | "servicio";
  descripcion_corta?: string;
  descripcion_larga?: string;
  unidad?: string;
  sku?: string;
  categoria_id?: string | null;
  precio?: number | null;
  moneda?: string;
  precio_a_consultar?: boolean;
  destacado?: boolean;
  estado?: "borrador" | "publicado";
  enlaces?: EnlaceItem[];
  palabras_clave?: string[];
};

export type ImagenItem = {
  id: string;
  item_id: string;
  bucket: string;
  ruta_archivo: string;
  nombre_archivo: string | null;
  mime_type: string | null;
  tamano_bytes: number | null;
  texto_alternativo: string | null;
  orden: number;
};

export async function getUserItems(role: "company" | "provider", entityId: string) {
  const supabase = await createClient();
  const filterKey = role === "company" ? "empresa_id" : "proveedor_id";

  const { data, error } = await supabase
    .from("items")
    .select("*, imagenes:imagenes_item(id,bucket,ruta_archivo,orden,texto_alternativo)")
    .eq(filterKey, entityId)
    .order("destacado", { ascending: false })
    .order("creado_en", { ascending: false });

  if (error) {
    console.error("Error fetching items:", error);
    return [];
  }
  return data || [];
}

export async function getItem(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select("*, imagenes:imagenes_item(*)")
    .eq("id", id)
    .single();
  if (error) {
    console.error("Error fetching item:", error);
    return null;
  }
  return data;
}

export async function getCategorias() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias")
    .select("id,nombre,categoria_padre_id,activa")
    .eq("activa", true)
    .order("nombre");
  if (error) return [];
  return data || [];
}

export async function createItem(
  role: "company" | "provider",
  entityId: string,
  payload: ItemPayload
) {
  const supabase = await createClient();
  const foreignKey = role === "company" ? { empresa_id: entityId } : { proveedor_id: entityId };

  const { data, error } = await supabase
    .from("items")
    .insert([
      {
        ...foreignKey,
        nombre: payload.nombre,
        tipo_item: payload.tipo_item,
        descripcion_corta: payload.descripcion_corta || null,
        descripcion_larga: payload.descripcion_larga || null,
        unidad: payload.unidad || null,
        sku: payload.sku || null,
        categoria_id: payload.categoria_id || null,
        precio: payload.precio_a_consultar ? null : payload.precio ?? null,
        moneda: payload.moneda || "ARS",
        precio_a_consultar: !!payload.precio_a_consultar,
        destacado: !!payload.destacado,
        estado: payload.estado || "publicado",
        enlaces: payload.enlaces || [],
        palabras_clave: payload.palabras_clave || [],
      },
    ])
    .select("id")
    .single();

  if (error) {
    console.error("Error creating item:", error);
    return { error: error.message };
  }

  revalidatePath("/perfil/productos-servicios");
  return { success: true, id: data.id };
}

export async function createItemsBulk(
  role: "company" | "provider",
  entityId: string,
  items: ItemPayload[]
) {
  const supabase = await createClient();
  const foreignKey = role === "company" ? { empresa_id: entityId } : { proveedor_id: entityId };

  if (!items.length) return { success: true, count: 0 };

  const rows = items.map((payload) => ({
    ...foreignKey,
    nombre: payload.nombre,
    tipo_item: payload.tipo_item,
    descripcion_corta: payload.descripcion_corta || null,
    descripcion_larga: payload.descripcion_larga || null,
    unidad: payload.unidad || null,
    sku: payload.sku || null,
    categoria_id: payload.categoria_id || null,
    precio: payload.precio_a_consultar ? null : payload.precio ?? null,
    moneda: payload.moneda || "ARS",
    precio_a_consultar: !!payload.precio_a_consultar,
    destacado: !!payload.destacado,
    estado: payload.estado || "publicado",
    enlaces: payload.enlaces || [],
    palabras_clave: payload.palabras_clave || [],
  }));

  const { error, count } = await supabase
    .from("items")
    .insert(rows, { count: "exact" });

  if (error) {
    console.error("Error bulk creating items:", error);
    return { error: error.message };
  }

  revalidatePath("/perfil/productos-servicios");
  return { success: true, count: count ?? rows.length };
}

export async function updateItem(id: string, payload: ItemPayload) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("items")
    .update({
      nombre: payload.nombre,
      tipo_item: payload.tipo_item,
      descripcion_corta: payload.descripcion_corta || null,
      descripcion_larga: payload.descripcion_larga || null,
      unidad: payload.unidad || null,
      sku: payload.sku || null,
      categoria_id: payload.categoria_id || null,
      precio: payload.precio_a_consultar ? null : payload.precio ?? null,
      moneda: payload.moneda || "ARS",
      precio_a_consultar: !!payload.precio_a_consultar,
      destacado: !!payload.destacado,
      estado: payload.estado || "publicado",
      enlaces: payload.enlaces || [],
      palabras_clave: payload.palabras_clave || [],
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating item:", error);
    return { error: error.message };
  }
  revalidatePath("/perfil/productos-servicios");
  return { success: true };
}

export async function deleteItem(id: string) {
  const supabase = await createClient();

  // Borramos las imágenes del bucket antes de borrar el ítem.
  const { data: imgs } = await supabase
    .from("imagenes_item")
    .select("bucket,ruta_archivo")
    .eq("item_id", id);

  if (imgs && imgs.length > 0) {
    const porBucket: Record<string, string[]> = {};
    for (const i of imgs) {
      porBucket[i.bucket] = porBucket[i.bucket] || [];
      porBucket[i.bucket].push(i.ruta_archivo);
    }
    for (const [bucket, paths] of Object.entries(porBucket)) {
      await supabase.storage.from(bucket).remove(paths);
    }
  }

  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) {
    console.error("Error deleting item:", error);
    return { error: error.message };
  }
  revalidatePath("/perfil/productos-servicios");
  return { success: true };
}

export async function registrarImagenItem(args: {
  item_id: string;
  bucket: string;
  ruta_archivo: string;
  nombre_archivo?: string;
  mime_type?: string;
  tamano_bytes?: number;
  texto_alternativo?: string;
  orden?: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("imagenes_item")
    .insert([
      {
        item_id: args.item_id,
        bucket: args.bucket,
        ruta_archivo: args.ruta_archivo,
        nombre_archivo: args.nombre_archivo ?? null,
        mime_type: args.mime_type ?? null,
        tamano_bytes: args.tamano_bytes ?? null,
        texto_alternativo: args.texto_alternativo ?? null,
        orden: args.orden ?? 0,
      },
    ])
    .select("*")
    .single();
  if (error) {
    console.error("Error registering image:", error);
    return { error: error.message };
  }
  revalidatePath("/perfil/productos-servicios");
  return { success: true, imagen: data };
}

export async function eliminarImagenItem(imagen_id: string) {
  const supabase = await createClient();

  const { data: img, error: errSel } = await supabase
    .from("imagenes_item")
    .select("bucket,ruta_archivo")
    .eq("id", imagen_id)
    .single();

  if (errSel) return { error: errSel.message };

  if (img) {
    await supabase.storage.from(img.bucket).remove([img.ruta_archivo]);
  }

  const { error } = await supabase.from("imagenes_item").delete().eq("id", imagen_id);
  if (error) return { error: error.message };

  revalidatePath("/perfil/productos-servicios");
  return { success: true };
}

export async function reordenarImagenesItem(ordenes: { id: string; orden: number }[]) {
  const supabase = await createClient();
  for (const o of ordenes) {
    await supabase.from("imagenes_item").update({ orden: o.orden }).eq("id", o.id);
  }
  revalidatePath("/perfil/productos-servicios");
  return { success: true };
}
