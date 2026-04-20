import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email/cliente";
import {
  plantillaRecordatorioVencimiento,
  plantillaSuscripcionSuspendida,
} from "@/lib/email/plantillas-suscripciones";

/**
 * GET /api/cron/suscripciones
 *
 * Ejecutado diariamente por Vercel Cron (ver vercel.json).
 * - Envía recordatorio 3 días antes de `proximo_cobro_en`.
 * - Mueve `activa` vencida a `en_mora` con gracia de 7 días.
 * - Mueve `en_mora` con gracia vencida a `suspendida` y notifica.
 *
 * Protegido por `CRON_SECRET` en header `x-cron-secret` o `authorization: Bearer <secret>`.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const en3dias = new Date(now.getTime() + 3 * 24 * 3600 * 1000);

  const resumen = { recordatorios: 0, enMora: 0, suspendidas: 0 };

  // 1. Recordatorios
  const { data: vencen } = await admin
    .from("suscripciones")
    .select("id, empresa_id, proveedor_id, monto, nombre_plan, proximo_cobro_en, ultima_notificacion_en")
    .eq("estado", "activa")
    .eq("metodo_pago", "mercadopago")
    .lte("proximo_cobro_en", en3dias.toISOString())
    .gt("proximo_cobro_en", now.toISOString());

  for (const s of vencen ?? []) {
    if (s.ultima_notificacion_en && new Date(s.ultima_notificacion_en).getTime() > now.getTime() - 2 * 24 * 3600 * 1000) {
      continue; // ya notificado en últimas 48h
    }
    const dest = await destinatario(admin, s);
    if (dest?.email) {
      const p = plantillaRecordatorioVencimiento({
        ...dest, plan: s.nombre_plan || "UIAB Conecta", monto: Number(s.monto), venceEn: s.proximo_cobro_en!,
      });
      await enviarEmail({ para: dest.email, asunto: p.asunto, html: p.html, texto: p.texto });
      await admin.from("suscripciones").update({ ultima_notificacion_en: now.toISOString() }).eq("id", s.id);
      resumen.recordatorios++;
    }
  }

  // 2. Pasar a en_mora
  const { data: morosas } = await admin
    .from("suscripciones")
    .select("id")
    .eq("estado", "activa")
    .lt("proximo_cobro_en", now.toISOString());
  for (const s of morosas ?? []) {
    const gracia = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
    await admin.from("suscripciones").update({
      estado: "en_mora", gracia_hasta: gracia, actualizado_en: now.toISOString(),
    }).eq("id", s.id);
    resumen.enMora++;
  }

  // 3. Suspender gracia vencida
  const { data: aSuspender } = await admin
    .from("suscripciones")
    .select("id, empresa_id, proveedor_id, monto, nombre_plan")
    .eq("estado", "en_mora")
    .lt("gracia_hasta", now.toISOString());
  for (const s of aSuspender ?? []) {
    await admin.from("suscripciones").update({
      estado: "suspendida", actualizado_en: now.toISOString(),
    }).eq("id", s.id);
    const dest = await destinatario(admin, s);
    if (dest?.email) {
      const p = plantillaSuscripcionSuspendida({
        ...dest, plan: s.nombre_plan || "UIAB Conecta", monto: Number(s.monto),
      });
      await enviarEmail({ para: dest.email, asunto: p.asunto, html: p.html, texto: p.texto });
    }
    resumen.suspendidas++;
  }

  return NextResponse.json({ ok: true, resumen });
}

async function destinatario(
  admin: ReturnType<typeof createAdminClient>,
  s: { empresa_id?: string | null; proveedor_id?: string | null }
): Promise<{ email: string; nombre: string; entidad: "empresa" | "particular" } | null> {
  if (s.empresa_id) {
    const { data } = await admin.from("empresas").select("email, razon_social").eq("id", s.empresa_id).maybeSingle();
    if (!data?.email) return null;
    return { email: data.email, nombre: data.razon_social || "", entidad: "empresa" };
  }
  if (s.proveedor_id) {
    const { data } = await admin.from("proveedores").select("email, nombre, apellido").eq("id", s.proveedor_id).maybeSingle();
    if (!data?.email) return null;
    return { email: data.email, nombre: [data.nombre, data.apellido].filter(Boolean).join(" "), entidad: "particular" };
  }
  return null;
}
