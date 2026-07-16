"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import {
  definirPasswordCore,
  generarYEnviarInvitacion,
} from "./invitaciones-core";

// ─── Server actions del flujo de invitación (callables desde el cliente) ────────
//
// Sólo se exponen las tres que son seguras de invocar sin sesión / desde el panel:
//  - validarInvitacion / definirPasswordConInvitacion: requieren conocer un token
//    de 256 bits, así que no filtran nada (el email es el del propio invitado).
//  - reenviarInvitacionAlta: sólo toma un altaId y reenvía al email ya registrado
//    en esa solicitud (a lo sumo, spam a una casilla propia).
// `generarYEnviarInvitacion` NO se expone acá: vive en invitaciones-core (no es
// una server action, sólo la usan módulos de servidor).

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Fija la contraseña a partir del token. El auto-login lo hace el cliente. */
export async function definirPasswordConInvitacion(token: string, password: string) {
  return definirPasswordCore(token, password);
}

/** Reenvía la invitación (nuevo token, 30 días) a una empresa que ya tiene cuenta. */
export async function reenviarInvitacionAlta(altaId: string) {
  const db = adminClient();

  const { data: alta, error: altaErr } = await db
    .from("altas_socios")
    .select("email, referente_nombre, razon_social, nombre_comercial")
    .eq("id", altaId)
    .single();
  if (altaErr || !alta) return { error: "No se encontró la solicitud." };

  const { data: perfil } = await db
    .from("perfiles")
    .select("id")
    .ilike("email", alta.email)
    .maybeSingle();
  if (!perfil) {
    return {
      error: 'Esta empresa todavía no tiene cuenta. Usá «Crear cuenta y dar acceso» primero.',
    };
  }

  const r = await generarYEnviarInvitacion({
    perfilId: perfil.id,
    email: alta.email,
    referenteNombre: alta.referente_nombre,
    nombreEmpresa: alta.nombre_comercial || alta.razon_social,
  });
  if (!r.ok) return { error: r.error ?? "No se pudo reenviar la invitación." };

  revalidatePath("/admin/altas");
  return { success: true as const };
}
