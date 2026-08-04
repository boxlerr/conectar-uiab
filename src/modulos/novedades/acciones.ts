"use server";

import { createClient } from "@/lib/supabase/servidor";
import { claveNovedad, type NovedadId } from "./novedades";

/**
 * Novedades: el cartel que aparece una vez cuando sale algo nuevo.
 *
 * Se guardan en el mismo `perfiles.tutoriales_vistos` que los tours (es un mapa
 * jsonb libre) con el prefijo `novedad_`, para no inventar otra tabla ni otra
 * columna por cada anuncio. Al ser por perfil y no localStorage, la persona lo
 * ve una sola vez aunque entre desde la compu y desde el teléfono.
 */
export async function marcarNovedadVista(id: NovedadId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false as const, error: "no-auth" };

  const { data: perfil, error: readError } = await supabase
    .from("perfiles")
    .select("tutoriales_vistos")
    .eq("id", user.id)
    .single();

  if (readError) return { ok: false as const, error: readError.message };

  const actual = (perfil?.tutoriales_vistos ?? {}) as Record<string, string | null>;
  const nuevo = { ...actual, [claveNovedad(id)]: new Date().toISOString() };

  const { error: updateError } = await supabase
    .from("perfiles")
    .update({ tutoriales_vistos: nuevo })
    .eq("id", user.id);

  if (updateError) return { ok: false as const, error: updateError.message };

  return { ok: true as const, tutorialesVistos: nuevo };
}
