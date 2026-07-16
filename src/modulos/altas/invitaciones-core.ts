import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { appUrl, enviarEmail } from "@/lib/email/cliente";
import { renderEmailBase } from "@/lib/email/plantillas";

// ─────────────────────────────────────────────────────────────────────────────
//  Núcleo del flujo de invitación por token propio (sin vencimiento en horas).
//
//  Estas funciones NO son server actions: son helpers de servidor que usan el
//  service_role. Viven en un módulo aparte (sin la directiva "use server") para
//  no quedar expuestas como acciones invocables desde el cliente — clave para
//  `generarYEnviarInvitacion`, que si fuera una action pública permitiría a
//  cualquiera fijar la contraseña de un perfil ajeno. Sólo las importan páginas
//  y acciones de servidor (page.tsx, acciones.ts, invitaciones.ts).
// ─────────────────────────────────────────────────────────────────────────────

export const DIAS_VALIDEZ_INVITACION = 30;

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Requisitos de contraseña: los mismos que /restablecer-password.
export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Al menos una mayúscula")
  .regex(/[0-9]/, "Al menos un número");

type MotivoInvalido = "invalido" | "usado" | "expirado";

/**
 * Genera un token nuevo, invalida los pendientes previos de ese perfil (sólo el
 * último vale), lo guarda hasheado y manda el email branded con el link.
 */
export async function generarYEnviarInvitacion(params: {
  perfilId: string;
  email: string;
  referenteNombre: string;
  nombreEmpresa: string;
}): Promise<{ ok: boolean; error?: string }> {
  const db = adminClient();
  const email = params.email.toLowerCase();

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);

  // Invalidar invitaciones previas sin usar de este perfil: sólo la nueva vale.
  await db
    .from("invitaciones_acceso")
    .update({ usado_en: new Date().toISOString() })
    .eq("perfil_id", params.perfilId)
    .is("usado_en", null);

  const { error: insErr } = await db.from("invitaciones_acceso").insert({
    perfil_id: params.perfilId,
    email,
    token_hash: tokenHash,
  });
  if (insErr) return { ok: false, error: `No se pudo generar la invitación: ${insErr.message}` };

  const link = `${appUrl()}/definir-password?token=${token}`;

  const res = await enviarEmail({
    para: email,
    asunto: "Tu acceso a UIAB Conecta está listo",
    html: renderEmailBase({
      preheader: "Definí tu contraseña y entrá al directorio de UIAB Conecta.",
      titulo: "¡Tu cuenta está activa!",
      intro: `Hola ${params.referenteNombre}, creamos el acceso de ${params.nombreEmpresa} a UIAB Conecta.`,
      cuerpo: `
        <p style="margin:0 0 16px 0;">Solo falta que definas tu contraseña para empezar a usar la plataforma. Al ingresar por primera vez te vamos a guiar con un tutorial rápido.</p>
        <p style="margin:0;color:#525b63;font-size:13px;">Este enlace es personal y válido por ${DIAS_VALIDEZ_INVITACION} días. Tomate el tiempo que necesites: si se vence, el equipo de UIAB puede reenviártelo.</p>
      `,
      cta: { etiqueta: "Definir mi contraseña", href: link },
      pie: "Si no esperabas este correo, podés ignorarlo con tranquilidad.",
    }),
    texto: `Hola ${params.referenteNombre}, tu acceso a UIAB Conecta (${params.nombreEmpresa}) está listo. Definí tu contraseña (enlace válido por ${DIAS_VALIDEZ_INVITACION} días): ${link}`,
  });

  if (res.skipped) {
    return { ok: false, error: "El SMTP no está configurado, así que el email no se envió. La invitación quedó creada: configurá el SMTP y usá «Reenviar invitación»." };
  }
  if (!res.ok) return { ok: false, error: res.error ?? "No se pudo enviar el email de invitación." };

  return { ok: true };
}

/** Valida un token contra la base (existe, sin usar, no vencido). */
export async function validarTokenCore(
  token: string
): Promise<
  | { ok: true; email: string; perfilId: string }
  | { ok: false; motivo: MotivoInvalido }
> {
  if (!token || token.length < 20) return { ok: false, motivo: "invalido" };

  const db = adminClient();
  const { data } = await db
    .from("invitaciones_acceso")
    .select("perfil_id, email, usado_en, expira_en")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (!data) return { ok: false, motivo: "invalido" };
  if (data.usado_en) return { ok: false, motivo: "usado" };
  if (new Date(data.expira_en) < new Date()) return { ok: false, motivo: "expirado" };

  return { ok: true, email: data.email, perfilId: data.perfil_id };
}

/**
 * Valida el token, fija la contraseña del usuario (service_role) y marca el
 * token como usado (un solo uso). Devuelve el email para el auto-login del cliente.
 */
export async function definirPasswordCore(
  token: string,
  password: string
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const pass = passwordSchema.safeParse(password);
  if (!pass.success) {
    return { ok: false, error: pass.error.issues[0]?.message ?? "La contraseña no cumple los requisitos." };
  }

  const val = await validarTokenCore(token);
  if (!val.ok) {
    const msg =
      val.motivo === "usado"
        ? "Este enlace ya fue utilizado. Iniciá sesión o pedí uno nuevo."
        : val.motivo === "expirado"
          ? "El enlace venció. Pedile al equipo de UIAB que te reenvíe la invitación."
          : "El enlace no es válido.";
    return { ok: false, error: msg };
  }

  const db = adminClient();

  const { error: updErr } = await db.auth.admin.updateUserById(val.perfilId, { password });
  if (updErr) return { ok: false, error: `No se pudo definir la contraseña: ${updErr.message}` };

  // Consumir el token (single-use). El `.is('usado_en', null)` evita el doble uso
  // en una carrera: si otro request ya lo consumió, este update no afecta filas.
  await db
    .from("invitaciones_acceso")
    .update({ usado_en: new Date().toISOString() })
    .eq("token_hash", hashToken(token))
    .is("usado_en", null);

  return { ok: true, email: val.email };
}
