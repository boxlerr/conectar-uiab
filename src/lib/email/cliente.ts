import nodemailer, { type Transporter } from "nodemailer";
import { LOGO_CID, LOGO_PNG_BASE64 } from "./logo";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CLIENTE DE CORREO — SMTP vía nodemailer
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Todo el sistema de correos corre sobre **un único servidor SMTP** que se
 *  configura una sola vez. Ese mismo SMTP se comparte con Supabase Auth
 *  (Dashboard > Auth > SMTP Settings), así los correos de autenticación
 *  (confirmación, recuperación) y los transaccionales de producto
 *  (notificación al admin, aprobación, rechazo) salen desde el mismo dominio
 *  y con la misma reputación.
 *
 *  Servicios SMTP gratuitos recomendados:
 *   - Gmail + App Password   → 500 correos/día, requiere 2FA en la cuenta.
 *   - Brevo (ex-Sendinblue)  → 300 correos/día en el plan gratuito.
 *   - Zoho, Mailjet, etc.    → todos con free tier razonable.
 *
 *  Envío seguro:
 *   - Si falta cualquier variable SMTP, no tiramos: logueamos warn y
 *     devolvemos `{ skipped: true }`. Un registro o una aprobación nunca
 *     deberían fallar por un correo caído.
 *   - Los errores del transporter se capturan y loguean, nunca se propagan
 *     al server action.
 */

let transporterSingleton: Transporter | null = null;
let configFaltanteLogueado = false;

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
}

function leerConfigSmtp(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !portRaw || !user || !pass) return null;

  const port = parseInt(portRaw, 10);
  if (!Number.isFinite(port)) return null;

  // 465 = TLS implícito. 587 y 25 = STARTTLS.
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === "true"
      : port === 465;

  return { host, port, user, pass, secure };
}

function obtenerTransporter(): Transporter | null {
  if (transporterSingleton) return transporterSingleton;
  const cfg = leerConfigSmtp();
  if (!cfg) {
    if (!configFaltanteLogueado) {
      console.warn(
        "[email] SMTP_HOST/PORT/USER/PASS no configurados — los correos transaccionales se saltarán silenciosamente."
      );
      configFaltanteLogueado = true;
    }
    return null;
  }
  transporterSingleton = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 5_000,
    socketTimeout: 10_000,
    greetingTimeout: 5_000,
  });
  return transporterSingleton;
}

/**
 * Remitente por defecto. Debe ser un correo válido del dominio SMTP
 * (muchos proveedores rechazan un From distinto al usuario autenticado).
 * Ejemplo: `"UIAB Conecta <no-reply@uiab.com.ar>"`.
 */
function remitentePorDefecto(): string {
  return (
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER ||
    "no-reply@uiab.com.ar"
  );
}

/**
 * Email del administrador que recibe las notificaciones de nuevas entidades
 * pendientes de revisión.
 */
export function emailAdmin(): string {
  return (
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.EMAIL_FROM ||
    "admin@uiab.com.ar"
  );
}

export interface EnviarEmailInput {
  para: string | string[];
  asunto: string;
  html: string;
  texto?: string;
  responderA?: string;
}

export interface EnviarEmailResultado {
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
}

/**
 * Adjunto inline del logo institucional.
 *
 * Va como attachment con Content-ID en vez de una `<img src="https://...">`
 * porque Outlook de escritorio bloquea las imágenes remotas por defecto: el
 * encabezado del correo llegaba sin marca. Un adjunto inline siempre se pinta,
 * y al ser `contentDisposition: "inline"` no aparece como archivo adjunto.
 *
 * Se agrega solo si el HTML realmente lo referencia (`cid:...`), así un correo
 * que no use la plantilla base no arrastra 9 KB al pedo.
 */
let logoBufferCache: Buffer | null = null;

function adjuntosDelHtml(html: string) {
  if (!html.includes(`cid:${LOGO_CID}`)) return undefined;
  logoBufferCache ??= Buffer.from(LOGO_PNG_BASE64, "base64");
  return [
    {
      filename: "uiab-conecta.png",
      content: logoBufferCache,
      contentType: "image/png",
      cid: LOGO_CID,
      contentDisposition: "inline" as const,
    },
  ];
}

/**
 * Envía un email transaccional. Nunca propaga excepciones: captura y loguea.
 * Usá esto desde server actions y API routes de Next.js.
 */
export async function enviarEmail(
  input: EnviarEmailInput
): Promise<EnviarEmailResultado> {
  const transporter = obtenerTransporter();
  if (!transporter) {
    const destino = Array.isArray(input.para) ? input.para.join(",") : input.para;
    console.warn(
      `[email] SMTP no configurado — saltando envío a ${destino}: "${input.asunto}"`
    );
    return { ok: false, skipped: true };
  }

  try {
    const info = await transporter.sendMail({
      from: remitentePorDefecto(),
      to: Array.isArray(input.para) ? input.para.join(", ") : input.para,
      subject: input.asunto,
      html: input.html,
      text: input.texto,
      replyTo: input.responderA,
      attachments: adjuntosDelHtml(input.html),
    });
    return { ok: true, id: info.messageId };
  } catch (err: unknown) {
    console.error("[email] Excepción enviando email por SMTP:", err);
    // Reiniciar el singleton por si la conexión quedó en estado inválido
    transporterSingleton = null;
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return { ok: false, error: msg };
  }
}

/**
 * URL base pública de la app (para links dentro de los emails).
 * Prioridad: `NEXT_PUBLIC_APP_URL` → `VERCEL_URL` → localhost.
 */
export function appUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
