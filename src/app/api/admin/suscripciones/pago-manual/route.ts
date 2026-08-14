import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { proximoCobro, nombrePlan, type CicloSuscripcion } from "@/lib/suscripciones/modelo";
import { enviarEmail } from "@/lib/email/cliente";
import { plantillaPagoManualRegistrado } from "@/lib/email/plantillas-suscripciones";
import { notificarEntidad } from "@/modulos/notificaciones/acciones";

/**
 * POST /api/admin/suscripciones/pago-manual
 *
 * Body:
 * {
 *   empresa_id?: string,
 *   proveedor_id?: string,
 *   metodo: 'transferencia' | 'efectivo' | 'cheque' | 'cortesia',
 *   ciclo?: 'mensual' | 'anual',
 *   monto: number,
 *   pagado_en: string (ISO),
 *   nota?: string
 * }
 *
 * Registra un pago cargado en persona por el admin —transferencia, efectivo,
 * cheque— y deja la suscripción activa hasta el próximo vencimiento. Sólo admins.
 *
 * `ciclo` no es opcional de verdad: sin él, un pago anual de $500.000 quedaba
 * con `proximo_cobro_en` a 30 días y el cron lo mandaba a mora al mes, con mail
 * de deuda incluido. Se acepta ausente sólo para no romper llamadas viejas, y
 * cae en 'mensual'.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const admin = createAdminClient();
  const { data: perfil } = await admin.from("perfiles").select("rol_sistema").eq("id", user.id).maybeSingle();
  if (perfil?.rol_sistema !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  const { empresa_id, proveedor_id, metodo, monto, pagado_en, nota } = body as {
    empresa_id?: string; proveedor_id?: string;
    metodo: "transferencia" | "efectivo" | "cheque" | "cortesia";
    monto: number; pagado_en: string; nota?: string;
  };
  const ciclo: CicloSuscripcion = body.ciclo === "anual" ? "anual" : "mensual";
  if ((!empresa_id && !proveedor_id) || !metodo || !monto || !pagado_en) {
    return NextResponse.json({ error: "Parámetros incompletos" }, { status: 400 });
  }
  if (!["transferencia", "efectivo", "cheque", "cortesia"].includes(metodo)) {
    return NextResponse.json({ error: "Método inválido" }, { status: 400 });
  }

  const filtro = empresa_id ? { empresa_id } : { proveedor_id };

  // Buscar o crear suscripción
  let { data: sus } = await admin
    .from("suscripciones")
    .select("id, nombre_plan")
    .match(filtro)
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sus) {
    // El plan ya no depende de la tarifa ni del rol: sale del ciclo y nada más.
    const { data: nueva, error: errIns } = await admin
      .from("suscripciones")
      .insert({
        empresa_id,
        proveedor_id,
        monto,
        moneda: "ARS",
        nombre_plan: nombrePlan(ciclo),
        estado: "activa",
        metodo_pago: metodo,
        ciclo,
      })
      .select("id, nombre_plan")
      .single();
    if (errIns) return NextResponse.json({ error: errIns.message }, { status: 500 });
    sus = nueva;
  }

  const proximo = proximoCobro(ciclo, new Date(pagado_en)).toISOString();

  // Pago manual
  const { error: errPago } = await admin.from("pagos_suscripciones").insert({
    suscripcion_id: sus.id,
    empresa_id,
    proveedor_id,
    monto,
    moneda: "ARS",
    estado: "aprobado",
    metodo_pago: metodo,
    tipo_pago: "manual",
    registrado_por: user.id,
    nota: nota || null,
    pagado_en,
  });
  if (errPago) return NextResponse.json({ error: errPago.message }, { status: 500 });

  // Actualizar suscripción
  await admin
    .from("suscripciones")
    .update({
      estado: "activa",
      metodo_pago: metodo,
      // El ciclo se escribe SIEMPRE: si la fila venía de un alta ('mensual' por
      // defecto) y el admin registra el pago de un año, dejarlo como estaba hacía
      // que el socio viera "$500.000 /mes" y que el cron lo venciera a los 30 días.
      ciclo,
      monto,
      nombre_plan: nombrePlan(ciclo),
      proximo_cobro_en: proximo,
      gracia_hasta: null,
      notas_admin: nota || null,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", sus.id);

  // Email
  let email: string | null = null;
  let nombre = "";
  let entidad: "empresa" | "particular" = "empresa";
  if (empresa_id) {
    const { data } = await admin.from("empresas").select("email, razon_social").eq("id", empresa_id).maybeSingle();
    email = data?.email || null;
    nombre = data?.razon_social || "";
  } else if (proveedor_id) {
    const { data } = await admin.from("proveedores").select("email, nombre, apellido").eq("id", proveedor_id).maybeSingle();
    email = data?.email || null;
    nombre = [data?.nombre, data?.apellido].filter(Boolean).join(" ");
    entidad = "particular";
  }
  if (email) {
    const p = plantillaPagoManualRegistrado({
      nombre, email,
      plan: nombrePlan(ciclo),
      monto,
      ciclo,
      metodo,
      pagadoEn: pagado_en,
      proximoCobro: proximo,
      nota: nota || null,
      entidad,
    });
    await enviarEmail({ para: email, asunto: p.asunto, html: p.html, texto: p.texto });
  }

  // Notificación in-web: registramos el pago manual y la suscripción quedó activa.
  await notificarEntidad({
    empresaId: empresa_id ?? null,
    proveedorId: proveedor_id ?? null,
    tipo: "pago_confirmado",
    titulo: "Registramos tu pago",
    mensaje: "Registramos tu pago y tu suscripción quedó activa.",
    url: "/perfil/suscripcion",
  });

  return NextResponse.json({ ok: true, suscripcion_id: sus.id });
}
