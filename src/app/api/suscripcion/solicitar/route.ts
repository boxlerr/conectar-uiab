import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { leerPrecios } from "@/lib/suscripciones/precios";
import { montoPorCiclo, nombrePlan, type CicloSuscripcion } from "@/lib/suscripciones/modelo";
import { enviarEmail, emailAdmin, appUrl } from "@/lib/email/cliente";
import { renderEmailBase } from "@/lib/email/plantillas";

/**
 * POST /api/suscripcion/solicitar  →  { ciclo: 'mensual' | 'anual' }
 *
 * El socio elige el plan y queda anotado. NO cobra: hoy la UIAB no tiene
 * pasarela — Mercado Pago se dio de baja el 2026-08-14 y SiPago todavía no está
 * integrada— así que el cobro se coordina por fuera (transferencia, en general)
 * y el admin lo registra desde /admin/suscripciones, que es lo que activa la
 * suscripción con el vencimiento correcto según el ciclo.
 *
 * Esto reemplaza a /api/mercadopago/crear-preapproval. Cuando entre SiPago, el
 * lugar donde se dispara el pago es acá: el resto del flujo ya no cambia.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ciclo: CicloSuscripcion = body?.ciclo === "anual" ? "anual" : "mensual";

  const admin = createAdminClient();

  const { data: perfil } = await admin
    .from("perfiles")
    .select("rol_sistema, nombre_completo, email")
    .eq("id", user.id)
    .maybeSingle();

  const rol = perfil?.rol_sistema;
  if (rol !== "company" && rol !== "provider") {
    return NextResponse.json({ error: "Esta cuenta no tiene una ficha para suscribir." }, { status: 400 });
  }

  const tabla = rol === "company" ? "miembros_empresa" : "miembros_proveedor";
  const columna = rol === "company" ? "empresa_id" : "proveedor_id";
  const { data: miembro } = await admin
    .from(tabla)
    .select(columna)
    .eq("perfil_id", user.id)
    .limit(1)
    .maybeSingle();

  const entidadId = (miembro as Record<string, string> | null)?.[columna];
  if (!entidadId) {
    return NextResponse.json({ error: "Tu cuenta no está vinculada a ninguna ficha." }, { status: 400 });
  }

  const precios = await leerPrecios();
  const monto = montoPorCiclo(ciclo, precios);

  const { data: sus } = await admin
    .from("suscripciones")
    .select("id, estado, metodo_pago, monto")
    .eq(columna, entidadId)
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  // A una socia de cortesía no se le pisa la suscripción: su acceso es sin cargo
  // y anotarle un pendiente_pago la dejaría afuera hasta que alguien lo arregle.
  if (sus && (sus.metodo_pago === "cortesia" || Number(sus.monto) === 0) && sus.estado === "activa") {
    return NextResponse.json(
      { error: "Tu acceso es de cortesía por ser socia de la UIAB: no tenés que contratar nada." },
      { status: 400 }
    );
  }

  const cambios = {
    [columna]: entidadId,
    ciclo,
    monto,
    moneda: "ARS",
    nombre_plan: nombrePlan(ciclo),
    estado: "pendiente_pago",
    metodo_pago: "transferencia",
    actualizado_en: new Date().toISOString(),
  };

  const { error } = sus
    ? await admin.from("suscripciones").update(cambios).eq("id", sus.id)
    : await admin.from("suscripciones").insert(cambios);

  if (error) {
    console.error("[suscripcion/solicitar]", error.message);
    return NextResponse.json({ error: "No pudimos registrar tu elección. Probá de nuevo." }, { status: 500 });
  }

  // El aviso al admin es el que hace que esto avance: sin pasarela, alguien
  // tiene que llamar y cobrar. Si el correo falla no se rompe la solicitud.
  try {
    const nombreEntidad = perfil?.nombre_completo || perfil?.email || "Un socio";
    const detalle =
      `${nombreEntidad} eligió el plan ${ciclo} de $${monto.toLocaleString("es-AR")}. ` +
      `Hay que coordinar el cobro y después registrarlo en el panel para que le quede activa.`;
    await enviarEmail({
      para: emailAdmin(),
      asunto: `Quieren contratar la suscripción (${ciclo})`,
      html: renderEmailBase({
        preheader: "Un socio eligió su plan y espera que lo contacten",
        titulo: "Alguien quiere contratar",
        intro: "Hay una solicitud de suscripción esperando.",
        cuerpo: `<p style="margin:0 0 16px 0;">${detalle}</p>`,
        cta: { etiqueta: "Ver en el panel", href: `${appUrl()}/admin/suscripciones` },
      }),
      texto: detalle,
    });
  } catch (err) {
    console.error("[suscripcion/solicitar] no se pudo avisar al admin:", err);
  }

  return NextResponse.json({ ok: true, ciclo, monto });
}
