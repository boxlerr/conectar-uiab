import { createClient } from "@supabase/supabase-js";
import { PanelResenas } from "./PanelResenas";

async function getResenas() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await supabase
    .from("resenas")
    .select(`
      id, calificacion, comentario, estado, motivo_moderacion, creada_en,
      empresa_resenada:empresas!empresa_resenada_id(razon_social),
      proveedor_resenado:proveedores!proveedor_resenado_id(nombre, apellido),
      empresa_autora:empresas!empresa_autora_id(razon_social),
      proveedor_autor:proveedores!proveedor_autor_id(nombre)
    `)
    .order("creada_en", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function AdminResenasPage() {
  const resenas = await getResenas();
  return <PanelResenas resenas={resenas as any} />;
}
