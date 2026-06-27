"use server";

import { z } from "zod";
import { appUrl, emailAdmin, enviarEmail } from "@/lib/email/cliente";
import { renderEmailBase } from "@/lib/email/plantillas";

const ContactoSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresá tu nombre").max(80),
  apellido: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email("Email inválido").max(160),
  asunto: z.string().trim().max(140).optional().or(z.literal("")),
  mensaje: z.string().trim().min(5, "Escribí un mensaje un poco más largo").max(2000),
  // Honeypot anti-spam: debe venir vacío. Si un bot lo llena, descartamos.
  empresa_web: z.string().optional(),
});

export type ContactoInput = z.input<typeof ContactoSchema>;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function enviarConsultaContacto(input: ContactoInput) {
  const parsed = ContactoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;

  // Honeypot lleno = bot → respondemos "ok" sin hacer nada.
  if (d.empresa_web && d.empresa_web.trim() !== "") {
    return { success: true as const };
  }

  const nombreCompleto = [d.nombre, d.apellido].filter(Boolean).join(" ");
  const asunto = d.asunto?.trim() || "Consulta desde el sitio";

  const res = await enviarEmail({
    para: emailAdmin(),
    asunto: `Contacto web: ${asunto}`,
    responderA: d.email,
    html: renderEmailBase({
      preheader: `Nueva consulta de ${nombreCompleto}.`,
      titulo: "Nueva consulta desde el sitio",
      intro: `${nombreCompleto} (${d.email}) escribió desde el formulario de contacto.`,
      cuerpo: `
        <p style="margin:0 0 8px 0;"><strong>Asunto:</strong> ${escapeHtml(asunto)}</p>
        <p style="margin:0 0 4px 0;"><strong>Mensaje:</strong></p>
        <p style="margin:0; white-space:pre-wrap;">${escapeHtml(d.mensaje)}</p>
      `,
      pie: `Podés responder directamente a este correo para contestarle a ${escapeHtml(d.nombre)}.`,
    }),
    texto: `Consulta de ${nombreCompleto} (${d.email})\nAsunto: ${asunto}\n\n${d.mensaje}`,
  });

  if (!res.ok && !res.skipped) {
    return { error: "No pudimos enviar tu consulta. Probá de nuevo en un momento." };
  }

  // Confirmación al remitente (no bloquea si falla).
  await enviarEmail({
    para: d.email,
    asunto: "Recibimos tu consulta — UIAB Conecta",
    html: renderEmailBase({
      preheader: "Gracias por escribirnos. Te respondemos a la brevedad.",
      titulo: "¡Recibimos tu mensaje!",
      intro: `Hola ${escapeHtml(d.nombre)}, gracias por contactarte con la Unión Industrial de Almirante Brown.`,
      cuerpo: `<p style="margin:0;">Tu consulta llegó a nuestro equipo y te vamos a responder a la brevedad a este correo.</p>`,
      cta: { etiqueta: "Conocé el directorio", href: `${appUrl()}/directorio` },
    }),
    texto: `Hola ${d.nombre}, recibimos tu consulta y te vamos a responder a la brevedad.`,
  });

  return { success: true as const };
}
