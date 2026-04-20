import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelarPreapproval } from "@/lib/mercadopago/cliente";
import { enviarEmail } from "@/lib/email/cliente";
import { plantillaSuscripcionCancelada } from "@/lib/email/plantillas-suscripciones";

/**
 * POST /api/mercadopago/cancelar
 * Body (opcional): { suscripcion_id?: string, as_admin?: boolean }
 *
 * - Usuario común: cancela SU propia suscripción activa.
 * - Admin: puede cancelar cualquiera pasando `suscripcion_id`.
 *
 * Cancela el preapproval en MP, marca la suscripción como `cancelada`
 * y permite acceso hasta `proximo_cobro_en` (ya pagó el período actual).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const admin = createAdminClient();

  const { data: perfil } = await admin
    .from("perfiles")
    .select("rol_sistema")
    .eq("id", user.id)
    .maybeSingle();

  let suscripcionId = body?.suscripcion_id as string | undefined;
  const esAdmin = perfil?.rol_sistema === "admin";

  if (!suscripcionId) {
    // Buscar la del usuario actual.
    const [emp, prov] = await Promise.all([
      admin.from("miembros_empresa").select("empresa_id").eq("perfil_id", user.id).maybeSingle(),
      admin.from("miembros_proveedor").select("proveedor_id").eq("perfil_id", user.id).maybeSingle(),
    ]);
    const filtro = emp.data?.empresa_id
      ? { empresa_id: emp.data.empresa_id }
      : prov.data?.proveedor_id
        ? { proveedor_id: prov.data.proveedor_id }
        : null;
    if (!filtro) return NextResponse.json({ error: "Sin entidad asociada" }, { status: 400 });

    const { data } = await admin
      .from("suscripciones")
      .select("id")
      .match(filtro)
      .in("estado", ["activa", "pendiente_pago", "en_mora"])
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();
    suscripcionId = data?.id;
  } else if (!esAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (!suscripcionId) {
    return NextResponse.json({ error: "No hay suscripción para cancelar" }, { status: 404 });
  }

  const { data: sus } = await admin
    .from("suscripciones")
    .select("id, empresa_id, proveedor_id, monto, nombre_plan, mercado_pago_preapproval_id, metodo_pago, proximo_cobro_en")
    .eq("id", suscripcionId)
    .single();
  if (!sus) return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });

  // Cancelar en MP si corresponde
  if (sus.metodo_pago === "mercadopago" && sus.mercado_pago_preapproval_id) {
    try {
      await cancelarPreapproval(sus.mercado_pago_preapproval_id);
    } catch (err: any) {
      console.error("[mp-cancelar] error", err);
      // Seguimos: marcamos cancelada local igual, pero avisamos.
    }
  }

  const now = new Date().toISOString();
  await admin
    .from("suscripciones")
    .update({
      estado: "cancelada",
      cancelada_en: now,
      finaliza_en: sus.proximo_cobro_en || now,
      actualizado_en: now,
    })
    .eq("id", suscripcionId);

  // Email
  let email: string | null = null;
  let nombre = "";
  let entidad: "empresa" | "particular" = "empresa";
  if (sus.empresa_id) {
    const { data } = await admin.from("empresas").select("email, razon_social").eq("id", sus.empresa_id).maybeSingle();
    email = data?.email || null;
    nombre = data?.razon_social || "";
  } else if (sus.proveedor_id) {
    const { data } = await admin.from("proveedores").select("email, nombre, apellido").eq("id", sus.proveedor_id).maybeSingle();
    email = data?.email || null;
    nombre = [data?.nombre, data?.apellido].filter(Boolean).join(" ");
    entidad = "particular";
  }
  if (email) {
    const p = plantillaSuscripcionCancelada({
      nombre, email,
      plan: sus.nombre_plan || "UIAB Conecta",
      monto: Number(sus.monto),
      finalizaEn: sus.proximo_cobro_en,
      entidad,
    });
    await enviarEmail({ para: email, asunto: p.asunto, html: p.html, texto: p.texto });
  }

  return NextResponse.json({ ok: true });
}
