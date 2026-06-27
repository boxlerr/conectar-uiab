"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/servidor";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const DEDUP_MS = 6 * 60 * 60 * 1000; // no recontar al mismo visitante en 6h

/**
 * Registra una visita a una ficha del directorio. No cuenta:
 *  - al propio dueño de la ficha (miembro de la entidad),
 *  - visitas repetidas del mismo usuario en las últimas 6 horas.
 * Es best-effort: nunca lanza, así no rompe el render de la ficha.
 */
export async function registrarVisitaPerfil(
  tipo: "empresa" | "proveedor",
  entidadId: string
) {
  try {
    if (!entidadId) return { ok: false as const };
    const col = tipo === "empresa" ? "empresa_id" : "proveedor_id";

    const supa = await createServerClient();
    const {
      data: { user },
    } = await supa.auth.getUser();
    const visitanteId = user?.id ?? null;

    const db = adminClient();

    if (visitanteId) {
      // ¿Es el dueño? (miembro de la entidad) → no contar.
      const miembrosTabla = tipo === "empresa" ? "miembros_empresa" : "miembros_proveedor";
      const { data: miembro } = await db
        .from(miembrosTabla)
        .select("id")
        .eq(col, entidadId)
        .eq("perfil_id", visitanteId)
        .maybeSingle();
      if (miembro) return { ok: true as const, propio: true };

      // Dedup: misma persona, misma ficha, últimas 6h.
      const desde = new Date(Date.now() - DEDUP_MS).toISOString();
      const { data: reciente } = await db
        .from("visitas_perfil")
        .select("id")
        .eq(col, entidadId)
        .eq("visitante_perfil_id", visitanteId)
        .gte("creado_en", desde)
        .maybeSingle();
      if (reciente) return { ok: true as const, dedup: true };
    }

    await db.from("visitas_perfil").insert({
      [col]: entidadId,
      visitante_perfil_id: visitanteId,
    });
    return { ok: true as const };
  } catch {
    return { ok: false as const };
  }
}

/**
 * Devuelve las métricas de visitas de la ficha del usuario logueado
 * (total histórico + últimos 30 días). null si no tiene entidad.
 */
export async function obtenerMisVisitas() {
  const supa = await createServerClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return null;

  const db = adminClient();

  // Resolver la entidad del usuario.
  const { data: me } = await db
    .from("miembros_empresa")
    .select("empresa_id")
    .eq("perfil_id", user.id)
    .maybeSingle();

  let col: "empresa_id" | "proveedor_id";
  let entidadId: string | null = null;

  if (me?.empresa_id) {
    col = "empresa_id";
    entidadId = me.empresa_id;
  } else {
    const { data: mp } = await db
      .from("miembros_proveedor")
      .select("proveedor_id")
      .eq("perfil_id", user.id)
      .maybeSingle();
    if (!mp?.proveedor_id) return null;
    col = "proveedor_id";
    entidadId = mp.proveedor_id;
  }

  const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: total }, { count: ultimos30 }] = await Promise.all([
    db.from("visitas_perfil").select("*", { count: "exact", head: true }).eq(col, entidadId),
    db
      .from("visitas_perfil")
      .select("*", { count: "exact", head: true })
      .eq(col, entidadId)
      .gte("creado_en", hace30),
  ]);

  return { total: total ?? 0, ultimos30: ultimos30 ?? 0 };
}
