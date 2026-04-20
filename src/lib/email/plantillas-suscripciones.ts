/**
 * Plantillas de email para el ciclo de vida de suscripciones UIAB Conecta.
 * Se mantienen separadas de `plantillas.ts` (registro/onboarding) para
 * que la búsqueda y el mantenimiento sean más directos.
 */

import { renderEmailBase, tarjetaDatos, chip } from "./plantillas";

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

const formatARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const formatFecha = (d: Date | string) =>
  new Date(d).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });

// ─── Datos comunes ──────────────────────────────────────────────────────────

export interface DatosSuscripcionComun {
  nombre: string;
  email: string;
  plan: string;
  monto: number;
  entidad: "empresa" | "particular";
}

// ─── 1. Completar pago (tras registro) ──────────────────────────────────────

export function plantillaSuscripcionPendiente(d: DatosSuscripcionComun & {
  urlCheckout: string;
}): { asunto: string; html: string; texto: string } {
  const cuerpo = `
    <p style="margin: 0 0 16px 0;">Hola <strong>${d.nombre}</strong>, ¡te damos la bienvenida a UIAB Conecta!</p>
    <p style="margin: 0 0 16px 0;">Para activar tu perfil y aparecer en el directorio, resta un último paso: completar el pago de tu suscripción.</p>
    ${tarjetaDatos([
      { etiqueta: "Plan", valor: d.plan },
      { etiqueta: "Monto mensual", valor: formatARS(d.monto) },
      { etiqueta: "Método", valor: "Mercado Pago (tarjeta recurrente)" },
    ])}
    <p style="margin: 20px 0 0 0;">Tu suscripción se renovará automáticamente. Podés cancelarla en cualquier momento desde tu perfil.</p>
  `;
  return {
    asunto: "Completá tu suscripción a UIAB Conecta",
    html: renderEmailBase({
      preheader: "Un paso más para activar tu perfil",
      titulo: "Activá tu suscripción",
      intro: "Te falta solo un paso para formar parte del directorio.",
      cuerpo,
      cta: { etiqueta: "Completar pago", href: d.urlCheckout },
    }),
    texto: `Hola ${d.nombre}, completá tu suscripción a UIAB Conecta: ${d.urlCheckout}`,
  };
}

// ─── 2. Pago confirmado ──────────────────────────────────────────────────────

export function plantillaPagoConfirmado(d: DatosSuscripcionComun & {
  pagadoEn: Date | string;
  proximoCobro: Date | string;
  metodoPago: "mercadopago" | "efectivo" | "cheque" | "cortesia";
  referenciaPago?: string | null;
}): { asunto: string; html: string; texto: string } {
  const nombreMetodo =
    d.metodoPago === "mercadopago" ? "Mercado Pago" :
    d.metodoPago === "efectivo" ? "Efectivo" :
    d.metodoPago === "cheque" ? "Cheque" : "Cortesía";

  const cuerpo = `
    <p style="margin: 0 0 16px 0;">${chip("Pago acreditado")}</p>
    <p style="margin: 0 0 16px 0;">Hola <strong>${d.nombre}</strong>, recibimos tu pago correctamente. Tu suscripción a UIAB Conecta está <strong>activa</strong>.</p>
    ${tarjetaDatos([
      { etiqueta: "Plan", valor: d.plan },
      { etiqueta: "Monto", valor: formatARS(d.monto) },
      { etiqueta: "Método", valor: nombreMetodo },
      { etiqueta: "Fecha de pago", valor: formatFecha(d.pagadoEn) },
      { etiqueta: "Próximo cobro", valor: formatFecha(d.proximoCobro) },
      ...(d.referenciaPago ? [{ etiqueta: "Referencia", valor: d.referenciaPago }] : []),
    ])}
    <p style="margin: 20px 0 0 0;">Podés ver tu historial de pagos y gestionar la suscripción desde tu perfil.</p>
  `;
  return {
    asunto: "¡Pago confirmado! Tu suscripción está activa",
    html: renderEmailBase({
      preheader: "Recibimos tu pago. Ya formás parte.",
      titulo: "¡Bienvenido a UIAB Conecta!",
      intro: "Tu suscripción quedó activa.",
      cuerpo,
      cta: { etiqueta: "Ir a mi perfil", href: `${appUrl()}/perfil/suscripcion` },
    }),
    texto: `Pago de ${formatARS(d.monto)} confirmado. Próximo cobro: ${formatFecha(d.proximoCobro)}.`,
  };
}

// ─── 3. Pago fallido ─────────────────────────────────────────────────────────

export function plantillaPagoFallido(d: DatosSuscripcionComun & {
  motivo?: string;
}): { asunto: string; html: string; texto: string } {
  const cuerpo = `
    <p style="margin: 0 0 16px 0;">Hola <strong>${d.nombre}</strong>, tuvimos un problema al procesar el cobro de tu suscripción.</p>
    ${tarjetaDatos([
      { etiqueta: "Plan", valor: d.plan },
      { etiqueta: "Monto", valor: formatARS(d.monto) },
      { etiqueta: "Motivo", valor: d.motivo || "Rechazado por el emisor de la tarjeta" },
    ])}
    <p style="margin: 20px 0 0 0;">Te sugerimos actualizar el medio de pago. Si no se puede resolver en los próximos 7 días, tu perfil quedará suspendido temporalmente.</p>
  `;
  return {
    asunto: "No pudimos procesar tu pago",
    html: renderEmailBase({
      preheader: "Acción requerida: actualizar medio de pago",
      titulo: "Pago rechazado",
      intro: "Tu suscripción sigue activa, pero necesitamos regularizar el cobro.",
      cuerpo,
      cta: { etiqueta: "Actualizar pago", href: `${appUrl()}/perfil/suscripcion` },
    }),
    texto: `Pago rechazado: ${d.motivo || "sin detalle"}. Actualizá tu medio en ${appUrl()}/perfil/suscripcion`,
  };
}

// ─── 4. Suscripción cancelada ────────────────────────────────────────────────

export function plantillaSuscripcionCancelada(d: DatosSuscripcionComun & {
  finalizaEn: Date | string | null;
}): { asunto: string; html: string; texto: string } {
  const cuerpo = `
    <p style="margin: 0 0 16px 0;">Hola <strong>${d.nombre}</strong>, confirmamos que cancelaste tu suscripción a UIAB Conecta.</p>
    ${tarjetaDatos([
      { etiqueta: "Plan", valor: d.plan },
      { etiqueta: "Acceso hasta", valor: d.finalizaEn ? formatFecha(d.finalizaEn) : "Inmediato" },
    ])}
    <p style="margin: 20px 0 0 0;">No se te cobrarán más montos. Si cambias de opinión, podés volver a activar tu suscripción desde tu perfil.</p>
  `;
  return {
    asunto: "Tu suscripción fue cancelada",
    html: renderEmailBase({
      preheader: "Confirmación de cancelación",
      titulo: "Suscripción cancelada",
      intro: "Gracias por acompañarnos.",
      cuerpo,
      cta: { etiqueta: "Reactivar suscripción", href: `${appUrl()}/perfil/suscripcion` },
    }),
    texto: `Tu suscripción a UIAB Conecta fue cancelada.`,
  };
}

// ─── 5. Recordatorio de vencimiento ─────────────────────────────────────────

export function plantillaRecordatorioVencimiento(d: DatosSuscripcionComun & {
  venceEn: Date | string;
}): { asunto: string; html: string; texto: string } {
  const cuerpo = `
    <p style="margin: 0 0 16px 0;">Hola <strong>${d.nombre}</strong>, tu próximo cobro de UIAB Conecta es el <strong>${formatFecha(d.venceEn)}</strong>.</p>
    ${tarjetaDatos([
      { etiqueta: "Plan", valor: d.plan },
      { etiqueta: "Monto", valor: formatARS(d.monto) },
    ])}
    <p style="margin: 20px 0 0 0;">Si tu medio de pago está al día, no tenés que hacer nada. Te avisamos por si querés anticiparte.</p>
  `;
  return {
    asunto: "Tu suscripción se renueva pronto",
    html: renderEmailBase({
      preheader: "Recordatorio de próximo cobro",
      titulo: "Renovación próxima",
      intro: "Tu suscripción se cobrará en los próximos días.",
      cuerpo,
    }),
    texto: `Tu suscripción se renueva el ${formatFecha(d.venceEn)} por ${formatARS(d.monto)}.`,
  };
}

// ─── 6. Suspensión por falta de pago ────────────────────────────────────────

export function plantillaSuscripcionSuspendida(d: DatosSuscripcionComun): {
  asunto: string; html: string; texto: string;
} {
  const cuerpo = `
    <p style="margin: 0 0 16px 0;">Hola <strong>${d.nombre}</strong>, tu acceso a UIAB Conecta fue <strong>suspendido</strong> por falta de pago.</p>
    ${tarjetaDatos([
      { etiqueta: "Plan", valor: d.plan },
      { etiqueta: "Monto adeudado", valor: formatARS(d.monto) },
    ])}
    <p style="margin: 20px 0 0 0;">Tu perfil ya no aparece en el directorio. Regularizá tu pago para reactivarlo de forma inmediata.</p>
  `;
  return {
    asunto: "Acceso suspendido — UIAB Conecta",
    html: renderEmailBase({
      preheader: "Regularizá tu pago para reactivar el acceso",
      titulo: "Suscripción suspendida",
      intro: "Necesitamos tu acción para reactivar tu perfil.",
      cuerpo,
      cta: { etiqueta: "Regularizar pago", href: `${appUrl()}/suscripcion/bloqueado` },
    }),
    texto: `Tu acceso fue suspendido por falta de pago. Regularizá en ${appUrl()}/suscripcion/bloqueado`,
  };
}

// ─── 7. Pago manual registrado (por admin) ──────────────────────────────────

export function plantillaPagoManualRegistrado(d: DatosSuscripcionComun & {
  metodo: "efectivo" | "cheque" | "cortesia";
  pagadoEn: Date | string;
  proximoCobro: Date | string;
  nota?: string | null;
}): { asunto: string; html: string; texto: string } {
  const nombreMetodo = d.metodo === "efectivo" ? "Efectivo" : d.metodo === "cheque" ? "Cheque" : "Cortesía";
  const cuerpo = `
    <p style="margin: 0 0 16px 0;">Hola <strong>${d.nombre}</strong>, registramos tu pago de forma manual desde el panel UIAB.</p>
    ${tarjetaDatos([
      { etiqueta: "Plan", valor: d.plan },
      { etiqueta: "Monto", valor: formatARS(d.monto) },
      { etiqueta: "Método", valor: nombreMetodo },
      { etiqueta: "Fecha", valor: formatFecha(d.pagadoEn) },
      { etiqueta: "Próximo cobro", valor: formatFecha(d.proximoCobro) },
      ...(d.nota ? [{ etiqueta: "Nota", valor: d.nota }] : []),
    ])}
    <p style="margin: 20px 0 0 0;">Tu suscripción está activa hasta la próxima fecha indicada.</p>
  `;
  return {
    asunto: "Registramos tu pago",
    html: renderEmailBase({
      preheader: "Pago cargado manualmente",
      titulo: "Pago registrado",
      intro: "Queda todo al día.",
      cuerpo,
      cta: { etiqueta: "Ver mi suscripción", href: `${appUrl()}/perfil/suscripcion` },
    }),
    texto: `Pago de ${formatARS(d.monto)} (${nombreMetodo}) registrado el ${formatFecha(d.pagadoEn)}.`,
  };
}
