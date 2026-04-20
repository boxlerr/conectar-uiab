import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Endpoint público: devuelve el árbol de categorías activas para alimentar
// el selector jerárquico del registro (usuario aún no autenticado).
export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await admin
    .from("categorias")
    .select("id, nombre, categoria_padre_id, activa")
    .eq("activa", true)
    .order("nombre");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categorias: data ?? [] });
}
