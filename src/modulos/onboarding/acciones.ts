"use server";

import { createClient } from "@/lib/supabase/servidor";
import type { TourId } from "./tipos";

/**
 * Marca un tour como visto en `perfiles.tutoriales_vistos`. Idempotente:
 * actualizar el mismo tour dos veces simplemente re-escribe la fecha.
 *
 * Devuelve el mapa completo actualizado para que el cliente pueda refrescar
 * su estado sin pegarle otra vez a la base.
 */
export async function marcarTourVisto(tourId: TourId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false as const, error: "no-auth" };
  }

  // Leer el mapa actual y mergear. No usamos jsonb_set a pelo para mantener
  // el código legible y evitar edge cases con claves especiales.
  const { data: perfil, error: readError } = await supabase
    .from("perfiles")
    .select("tutoriales_vistos")
    .eq("id", user.id)
    .single();

  if (readError) {
    return { ok: false as const, error: readError.message };
  }

  const actual = (perfil?.tutoriales_vistos ?? {}) as Record<string, string | null>;
  const nuevo = { ...actual, [tourId]: new Date().toISOString() };

  const { error: updateError } = await supabase
    .from("perfiles")
    .update({ tutoriales_vistos: nuevo })
    .eq("id", user.id);

  if (updateError) {
    return { ok: false as const, error: updateError.message };
  }

  return { ok: true as const, tutorialesVistos: nuevo };
}

/**
 * Resetea un tour (lo marca como no visto). Lo usa el botón "Volver a ver
 * tutorial" antes de re-disparar el runner.
 */
export async function resetearTour(tourId: TourId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false as const, error: "no-auth" };
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("tutoriales_vistos")
    .eq("id", user.id)
    .single();

  const actual = (perfil?.tutoriales_vistos ?? {}) as Record<string, string | null>;
  const nuevo = { ...actual, [tourId]: null };

  const { error: updateError } = await supabase
    .from("perfiles")
    .update({ tutoriales_vistos: nuevo })
    .eq("id", user.id);

  if (updateError) {
    return { ok: false as const, error: updateError.message };
  }

  return { ok: true as const, tutorialesVistos: nuevo };
}
