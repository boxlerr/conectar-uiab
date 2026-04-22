import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerPayment, obtenerPreapproval } from "@/lib/mercadopago/cliente";
import { validarFirmaWebhook } from "@/lib/mercadopago/firma";
import { sumarUnMes, nombrePlan } from "@/lib/mercadopago/suscripciones";
import { enviarEmail, emailAdmin } from "@/lib/email/cliente";
import {
  plantillaPagoConfirmado,
  plantillaPagoFallido,
  plantillaPagoConfirmadoAdmin,
} from "@/lib/email/plantillas-suscripciones";

/**
 * POST /api/mercadopago/webhook
 *
 * Mercado Pago nos notifica eventos de pagos y suscripciones. Respondemos
 * 200 siempre que hayamos persistido o decidido ignorar el evento, para
 * evitar reintentos infinitos (MP reintenta hasta 5 veces si hay 4xx/5xx).
 */
export async function POST(req: NextRequest) {
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: "body inválido" }, { status: 200 });
  }

  const dataId = body?.data?.id ? String(body.data.id) : null;
  const tipo: string = body.type || body.topic || "unknown";

  // Validación de firma (no aborta el 200; solo loguea en test).
  const firma = validarFirmaWebhook({ xSignature, xRequestId, dataId });
  if (!firma.ok) {
    console.warn("[mp-webhook] firma inválida:", firma.razon, { tipo, dataId });
    return NextResponse.json({ ok: false, error: firma.razon }, { status: 401 });
  }

  const admin = createAdminClient();

  try {
    if (tipo === "payment" || tipo === "subscription_authorized_payment") {
      await procesarPayment(admin, dataId);
    } else if (tipo === "subscription_preapproval" || tipo === "preapproval") {
      await procesarPreapproval(admin, dataId);
    } else {
      console.log("[mp-webhook] tipo ignorado:", tipo);
    }
  } catch (err: any) {
    console.error("[mp-webhook] error procesando", tipo, dataId, err);
    // Igual respondemos 200 para no loopear: queda log + auditoría.
    try {
      await admin.from("pagos_suscripciones").insert({
        estado: "error",
        payload: { tipo, dataId, error: String(err?.message || err), body },
      });
    } catch { /* best-effort audit log */ }
  }

  return NextResponse.json({ ok: true });
}

async function procesarPayment(admin: ReturnType<typeof createAdminClient>, paymentId: string | null) {
  if (!paymentId) return;
  const pago = await obtenerPayment(paymentId);
  const externalRef = pago.external_reference || "";
  const match = externalRef.match(/^suscripcion:([0-9a-f-]{36})$/i);
  if (!match) {
    console.warn("[mp-webhook] external_reference sin match:", externalRef);
    return;
  }
  const suscripcionId = match[1];

  const { data: sus } = await admin
    .from("suscripciones")
    .select("id, empresa_id, proveedor_id, monto, moneda, nombre_plan")
    .eq("id", suscripcionId)
    .maybeSingle();
  if (!sus) return;

  const estado = pago.status === "approved" ? "aprobado"
    : pago.status === "rejected" ? "rechazado"
    : pago.status === "refunded" ? "reembolsado"
    : "pendiente";

  // upsert idempotente por mercado_pago_payment_id.
  await admin
    .from("pagos_suscripciones")
    .upsert(
      {
        suscripcion_id: suscripcionId,
        empresa_id: sus.empresa_id,
        proveedor_id: sus.proveedor_id,
        monto: pago.transaction_amount,
        moneda: pago.currency_id,
        estado,
        external_reference: externalRef,
        mercado_pago_payment_id: String(pago.id),
        metodo_pago: "mercadopago",
        tipo_pago: "automatico",
        payload: pago as any,
        pagado_en: pago.date_approved || pago.date_created,
      },
      { onConflict: "mercado_pago_payment_id" }
    );

  if (pago.status === "approved") {
    const proximo = sumarUnMes(new Date(pago.date_approved || Date.now())).toISOString();
    await admin
      .from("suscripciones")
      .update({
        estado: "activa",
        inicia_en: sus.nombre_plan ? undefined : new Date().toISOString(),
        proximo_cobro_en: proximo,
        gracia_hasta: null,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", suscripcionId);

    await enviarEmailPago(admin, sus, pago, "confirmado", proximo);
    await enviarEmailPagoAdmin(admin, sus, pago);
  } else if (pago.status === "rejected") {
    await enviarEmailPago(admin, sus, pago, "fallido");
  }
}

async function procesarPreapproval(admin: ReturnType<typeof createAdminClient>, preapprovalId: string | null) {
  if (!preapprovalId) return;
  const pre = await obtenerPreapproval(preapprovalId);

  const estadoMap: Record<string, string> = {
    authorized: "activa",
    paused: "en_mora",
    cancelled: "cancelada",
    pending: "pendiente_pago",
  };

  const nuevoEstado = estadoMap[pre.status] ?? "pendiente_pago";

  await admin
    .from("suscripciones")
    .update({
      estado: nuevoEstado,
      mercado_pago_preapproval_id: pre.id,
      proximo_cobro_en: pre.next_payment_date || null,
      actualizado_en: new Date().toISOString(),
      ...(nuevoEstado === "cancelada" ? { cancelada_en: new Date().toISOString() } : {}),
    })
    .eq("mercado_pago_preapproval_id", pre.id);
}

async function enviarEmailPago(
  admin: ReturnType<typeof createAdminClient>,
  sus: { empresa_id: string | null; proveedor_id: string | null; monto: number; nombre_plan: string | null },
  pago: any,
  tipo: "confirmado" | "fallido",
  proximo?: string
) {
  // Destinatario
  let email: string | null = null;
  let nombre: string = "";
  let entidad: "empresa" | "particular" = "empresa";

  if (sus.empresa_id) {
    const { data } = await admin.from("empresas").select("email, razon_social").eq("id", sus.empresa_id).maybeSingle();
    email = data?.email || null;
    nombre = data?.razon_social || "";
    entidad = "empresa";
  } else if (sus.proveedor_id) {
    const { data } = await admin.from("proveedores").select("email, nombre, apellido").eq("id", sus.proveedor_id).maybeSingle();
    email = data?.email || null;
    nombre = [data?.nombre, data?.apellido].filter(Boolean).join(" ");
    entidad = "particular";
  }
  if (!email) return;

  const plantilla =
    tipo === "confirmado"
      ? plantillaPagoConfirmado({
          nombre, email, plan: sus.nombre_plan || nombrePlan(entidad === "empresa" ? "company" : "provider"),
          monto: Number(sus.monto),
          pagadoEn: pago.date_approved || pago.date_created,
          proximoCobro: proximo || new Date().toISOString(),
          metodoPago: "mercadopago",
          referenciaPago: String(pago.id),
          entidad,
        })
      : plantillaPagoFallido({
          nombre, email, plan: sus.nombre_plan || "UIAB Conecta",
          monto: Number(sus.monto),
          motivo: pago.status_detail,
          entidad,
        });

  await enviarEmail({
    para: email,
    asunto: plantilla.asunto,
    html: plantilla.html,
    texto: plantilla.texto,
  });
}

async function enviarEmailPagoAdmin(
  admin: ReturnType<typeof createAdminClient>,
  sus: { empresa_id: string | null; proveedor_id: string | null; monto: number; nombre_plan: string | null },
  pago: any
) {
  let nombre = "";
  let email = "";
  let entidad: "empresa" | "particular" = "empresa";

  if (sus.empresa_id) {
    const { data } = await admin.from("empresas").select("razon_social, email").eq("id", sus.empresa_id).maybeSingle();
    nombre = data?.razon_social || "Empresa";
    email = data?.email || "";
    entidad = "empresa";
  } else if (sus.proveedor_id) {
    const { data } = await admin.from("proveedores").select("nombre, apellido, email").eq("id", sus.proveedor_id).maybeSingle();
    nombre = [data?.nombre, data?.apellido].filter(Boolean).join(" ") || "Particular";
    email = data?.email || "";
    entidad = "particular";
  }

  const adminEmail = emailAdmin();
  const formatARS = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  const plantilla = plantillaPagoConfirmadoAdmin({
    nombre,
    email,
    plan: sus.nombre_plan || "UIAB Conecta",
    monto: Number(sus.monto),
    pagadoEn: pago.date_approved || pago.date_created,
    referenciaPago: String(pago.id),
    entidad,
  });

  await enviarEmail({
    para: adminEmail,
    asunto: plantilla.asunto,
    html: plantilla.html,
    texto: plantilla.texto,
  });
}

// GET para health-check simple
export async function GET() {
  return NextResponse.json({ ok: true, service: "mercadopago-webhook" });
}
