import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerPreapproval } from "@/lib/mercadopago/cliente";
import { sumarUnMes } from "@/lib/mercadopago/suscripciones";
import { enviarEmail, emailAdmin } from "@/lib/email/cliente";
import {
  plantillaPagoConfirmado,
  plantillaPagoConfirmadoAdmin,
} from "@/lib/email/plantillas-suscripciones";

/**
 * POST /api/mercadopago/verificar-pago
 *
 * Consulta el estado del preapproval en la API de Mercado Pago y actualiza
 * la suscripción local si ya fue autorizada. Esto es necesario porque en
 * desarrollo local el webhook de MP no puede llegar a localhost.
 *
 * También sirve como fallback en producción si el webhook se demora.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 1. Encontrar la entidad del usuario
  const { data: perfil } = await admin
    .from("perfiles")
    .select("id, rol_sistema")
    .eq("id", user.id)
    .maybeSingle();
  if (!perfil) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  let entityId: string | null = null;
  let fk: "empresa_id" | "proveedor_id" = "empresa_id";

  if (perfil.rol_sistema === "company") {
    const { data: m } = await admin
      .from("miembros_empresa")
      .select("empresa_id")
      .eq("perfil_id", user.id)
      .maybeSingle();
    entityId = m?.empresa_id ?? null;
    fk = "empresa_id";
  } else if (perfil.rol_sistema === "provider") {
    const { data: m } = await admin
      .from("miembros_proveedor")
      .select("proveedor_id")
      .eq("perfil_id", user.id)
      .maybeSingle();
    entityId = m?.proveedor_id ?? null;
    fk = "proveedor_id";
  }

  if (!entityId) {
    return NextResponse.json({ error: "Entidad no encontrada" }, { status: 404 });
  }

  // 2. Buscar la suscripción más reciente
  const { data: sus } = await admin
    .from("suscripciones")
    .select("id, estado, mercado_pago_preapproval_id, monto, moneda, nombre_plan, empresa_id, proveedor_id")
    .eq(fk, entityId)
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sus) {
    return NextResponse.json({ error: "Sin suscripción" }, { status: 404 });
  }

  // Si ya está activa, no hacer nada
  if (sus.estado === "activa") {
    return NextResponse.json({ ok: true, estado: "activa", ya_activa: true });
  }

  // Si no tiene preapproval_id, no podemos verificar
  if (!sus.mercado_pago_preapproval_id) {
    return NextResponse.json({ ok: false, estado: sus.estado, sin_preapproval: true });
  }

  // 3. Consultar el preapproval en la API de Mercado Pago
  let preapproval;
  try {
    preapproval = await obtenerPreapproval(sus.mercado_pago_preapproval_id);
  } catch (err: any) {
    console.error("[mp] verificar-pago: error consultando preapproval", err);
    return NextResponse.json(
      { ok: false, error: "Error consultando Mercado Pago", detalle: err?.message },
      { status: 502 }
    );
  }

  // 4. Si el preapproval está "authorized", la suscripción pasa a activa
  if (preapproval.status === "authorized") {
    const ahora = new Date();
    const proximo = sumarUnMes(ahora).toISOString();

    await admin
      .from("suscripciones")
      .update({
        estado: "activa",
        inicia_en: ahora.toISOString(),
        proximo_cobro_en: preapproval.next_payment_date || proximo,
        gracia_hasta: null,
        actualizado_en: ahora.toISOString(),
      })
      .eq("id", sus.id);

    // Enviar emails de confirmación
    try {
      await enviarEmailsConfirmacion(admin, sus, preapproval, proximo);
    } catch (err) {
      console.error("[mp] verificar-pago: error enviando emails", err);
      // No fallar por esto
    }

    return NextResponse.json({ ok: true, estado: "activa", actualizado: true });
  }

  // Si está en otro estado, devolver sin cambiar
  return NextResponse.json({
    ok: true,
    estado: sus.estado,
    mp_status: preapproval.status,
    actualizado: false,
  });
}

async function enviarEmailsConfirmacion(
  admin: ReturnType<typeof createAdminClient>,
  sus: { empresa_id: string | null; proveedor_id: string | null; monto: number; nombre_plan: string | null },
  preapproval: any,
  proximo: string
) {
  let nombre = "";
  let email = "";
  let entidad: "empresa" | "particular" = "empresa";

  if (sus.empresa_id) {
    const { data } = await admin
      .from("empresas")
      .select("razon_social, email")
      .eq("id", sus.empresa_id)
      .maybeSingle();
    nombre = data?.razon_social || "Empresa";
    email = data?.email || "";
    entidad = "empresa";
  } else if (sus.proveedor_id) {
    const { data } = await admin
      .from("proveedores")
      .select("nombre, apellido, email")
      .eq("id", sus.proveedor_id)
      .maybeSingle();
    nombre = [data?.nombre, data?.apellido].filter(Boolean).join(" ") || "Particular";
    email = data?.email || "";
    entidad = "particular";
  }

  const ahora = new Date().toISOString();

  // Email al suscriptor
  if (email) {
    const plantilla = plantillaPagoConfirmado({
      nombre,
      email,
      plan: sus.nombre_plan || "UIAB Conecta",
      monto: Number(sus.monto),
      pagadoEn: ahora,
      proximoCobro: proximo,
      metodoPago: "mercadopago",
      referenciaPago: preapproval.id,
      entidad,
    });
    await enviarEmail({
      para: email,
      asunto: plantilla.asunto,
      html: plantilla.html,
      texto: plantilla.texto,
    });
  }

  // Email al admin
  const adminEmail = emailAdmin();
  const plantillaAdmin = plantillaPagoConfirmadoAdmin({
    nombre,
    email,
    plan: sus.nombre_plan || "UIAB Conecta",
    monto: Number(sus.monto),
    pagadoEn: ahora,
    referenciaPago: preapproval.id,
    entidad,
  });
  await enviarEmail({
    para: adminEmail,
    asunto: plantillaAdmin.asunto,
    html: plantillaAdmin.html,
    texto: plantillaAdmin.texto,
  });
}
