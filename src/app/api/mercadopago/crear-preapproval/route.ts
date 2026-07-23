import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { crearPreapproval } from "@/lib/mercadopago/cliente";
import {
  montoPorCiclo,
  nombrePlan,
  type CicloSuscripcion,
} from "@/lib/mercadopago/suscripciones";

/**
 * POST /api/mercadopago/crear-preapproval
 *
 * Crea (o reemplaza) la suscripción recurrente en MP para el usuario actual,
 * persiste la fila en `suscripciones` y devuelve la URL (`init_point`) a la
 * que redirigir al usuario.
 *
 * Requiere sesión. No recibe body — el monto se calcula del lado servidor
 * a partir de la tarifa de la empresa.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Ciclo elegido en el checkout (mensual por defecto).
  const body = await req.json().catch(() => null);
  const ciclo: CicloSuscripcion = body?.ciclo === "anual" ? "anual" : "mensual";

  // 1. Perfil + entidad asociada
  const { data: perfil } = await admin
    .from("perfiles")
    .select("id, email, nombre_completo, rol_sistema")
    .eq("id", user.id)
    .maybeSingle();
  if (!perfil) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  let empresa_id: string | null = null;
  let proveedor_id: string | null = null;
  let tarifa: number | null = null;

  if (perfil.rol_sistema === "company") {
    const { data: m } = await admin.from("miembros_empresa").select("empresa_id").eq("perfil_id", user.id).maybeSingle();
    empresa_id = m?.empresa_id ?? null;
    if (empresa_id) {
      const { data: emp } = await admin.from("empresas").select("tarifa, n_socio").eq("id", empresa_id).maybeSingle();
      tarifa = emp?.tarifa ?? null;
      // Las socias UIAB (n_socio presente) tienen acceso sin cargo: no pasan por el checkout.
      if (emp?.n_socio) {
        return NextResponse.json(
          { error: "Sos socia de la UIAB: tu acceso es sin cargo, no necesitás suscripción." },
          { status: 400 }
        );
      }
    }
  } else if (perfil.rol_sistema === "provider") {
    const { data: m } = await admin.from("miembros_proveedor").select("proveedor_id").eq("perfil_id", user.id).maybeSingle();
    proveedor_id = m?.proveedor_id ?? null;
  } else {
    return NextResponse.json({ error: "Rol no pagante" }, { status: 400 });
  }

  if (!empresa_id && !proveedor_id) {
    return NextResponse.json({ error: "No se encontró la entidad del usuario" }, { status: 400 });
  }

  // 2. Monto plano según ciclo ($50.000/mes ó $500.000/año).
  const monto = montoPorCiclo(ciclo);
  const plan = nombrePlan(perfil.rol_sistema, tarifa, ciclo);

  // 3. Upsert suscripción pendiente
  const filtro = empresa_id ? { empresa_id } : { proveedor_id };
  const { data: existente } = await admin
    .from("suscripciones")
    .select("id, estado, mercado_pago_preapproval_id")
    .match(filtro)
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  let suscripcionId = existente?.id ?? null;
  if (!suscripcionId) {
    const { data: nueva, error: errIns } = await admin
      .from("suscripciones")
      .insert({
        empresa_id,
        proveedor_id,
        monto,
        moneda: "ARS",
        nombre_plan: plan,
        estado: "pendiente_pago",
        metodo_pago: "mercadopago",
        ciclo,
      })
      .select("id")
      .single();
    if (errIns) return NextResponse.json({ error: errIns.message }, { status: 500 });
    suscripcionId = nueva.id;
  } else if (existente?.estado === "activa" && existente.mercado_pago_preapproval_id) {
    return NextResponse.json({ error: "Ya tenés una suscripción activa" }, { status: 409 });
  } else {
    await admin
      .from("suscripciones")
      .update({ monto, nombre_plan: plan, estado: "pendiente_pago", metodo_pago: "mercadopago", ciclo, actualizado_en: new Date().toISOString() })
      .eq("id", suscripcionId);
  }

  // 4. Crear preapproval en MP
  const origin = req.headers.get("origin") || req.nextUrl.origin;
  const appUrl = origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const externalReference = `suscripcion:${suscripcionId}`;

  // IMPORTANT: Never use the merchant's email as payer_email, it causes 400 errors.
  let payerEmail = perfil.email || user.email || "";

  // In test environment, if the collector is a test user, the payer MUST also be a valid test user.
  // We allow overriding the payerEmail via .env to the Test Buyer's email to avoid API errors.
  if (process.env.MP_ENTORNO === "test" && process.env.MP_TEST_PAYER_EMAIL) {
    payerEmail = process.env.MP_TEST_PAYER_EMAIL;
  }

  let preapproval;
  try {
    preapproval = await crearPreapproval(
      {
        reason: plan,
        external_reference: externalReference,
        payer_email: payerEmail,
        back_url: `${appUrl}/pendiente-aprobacion?mp=ok`,
        auto_recurring: {
          frequency: ciclo === "anual" ? 12 : 1,
          frequency_type: "months",
          transaction_amount: monto,
          currency_id: "ARS",
        },
        status: "pending",
        notification_url: `${appUrl}/api/mercadopago/webhook`,
      },
      { idempotencyKey: `preapproval-${suscripcionId}-${Date.now()}` }
    );
  } catch (err: any) {
    console.error("[mp] crearPreapproval", err);
    return NextResponse.json(
      { error: "No se pudo crear la suscripción en Mercado Pago", detalle: err?.message },
      { status: 502 }
    );
  }

  // 5. Guardar preapproval_id
  await admin
    .from("suscripciones")
    .update({
      mercado_pago_preapproval_id: preapproval.id,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", suscripcionId);

  return NextResponse.json({
    ok: true,
    init_point: preapproval.init_point,
    preapproval_id: preapproval.id,
    suscripcion_id: suscripcionId,
    monto,
  });
}
