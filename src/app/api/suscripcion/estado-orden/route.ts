import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { acreditarOrden } from "@/lib/sipago/acreditacion";
import { sipagoConfigurado } from "@/lib/sipago/cliente";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/suscripcion/estado-orden
 *
 * Consulta —y si corresponde acredita— la última orden de Sipago del socio que
 * está pidiendo. La usa /suscripcion/resultado cuando el socio vuelve del
 * checkout.
 *
 * Esto NO es un adorno del webhook: es la segunda vía. El webhook de Sipago
 * reintenta cuatro veces en unos ocho minutos y después se rinde, y no viene
 * firmado ni garantizado. Un deploy justo en esa ventana alcanza para que un
 * socio pague y la plataforma no se entere nunca. Acá, apenas vuelve al sitio,
 * se le pregunta a Sipago por la orden y se acredita si está paga.
 *
 * Que los dos caminos puedan correr a la vez está contemplado: `acreditarOrden`
 * es idempotente y el índice único sobre `sipago_order_uuid` corta el empate.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const admin = createAdminClient();

  const { data: perfil } = await admin
    .from("perfiles")
    .select("rol_sistema")
    .eq("id", user.id)
    .maybeSingle();

  const rol = perfil?.rol_sistema;
  if (rol !== "company" && rol !== "provider") {
    return NextResponse.json({ error: "Esta cuenta no tiene una suscripción." }, { status: 400 });
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

  const { data: sus } = await admin
    .from("suscripciones")
    .select("id, estado, metodo_pago, sipago_order_uuid, proximo_cobro_en")
    .eq(columna, entidadId)
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sus) return NextResponse.json({ error: "No encontramos tu suscripción." }, { status: 404 });

  // Sin orden o sin pasarela no hay nada que consultar: se devuelve el estado
  // que ya tiene la suscripción y la página decide qué mostrar.
  // El plan recurrente no genera orden: el socio deja la tarjeta adherida en
  // Sipago y el primer cobro aparece en el reporte, no acá. Se devuelve como
  // caso propio para que la pantalla no le diga "no encontramos ningún pago".
  if (sus.metodo_pago === "sipago_suscripcion") {
    return NextResponse.json({ ok: true, orden: "adhesion", estadoSuscripcion: sus.estado });
  }

  if (!sus.sipago_order_uuid || !sipagoConfigurado()) {
    return NextResponse.json({ ok: true, orden: null, estadoSuscripcion: sus.estado });
  }

  try {
    const resultado = await acreditarOrden(sus.sipago_order_uuid);

    // Se relee la suscripción: `acreditarOrden` pudo haberla dejado activa y la
    // página necesita el estado de después, no el de antes.
    const { data: despues } = await admin
      .from("suscripciones")
      .select("estado, proximo_cobro_en")
      .eq("id", sus.id)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      orden: resultado.estado,
      motivo: "motivo" in resultado ? resultado.motivo : undefined,
      puedeReintentar: "puedeReintentar" in resultado ? resultado.puedeReintentar : false,
      estadoSuscripcion: despues?.estado ?? sus.estado,
      proximoCobro: despues?.proximo_cobro_en ?? null,
    });
  } catch (err) {
    console.error("[suscripcion/estado-orden]", err);
    // Que Sipago no conteste no es motivo para asustar al socio: si el pago
    // salió, el webhook o el próximo refresh lo van a acreditar igual.
    return NextResponse.json({ ok: true, orden: "indeterminado", estadoSuscripcion: sus.estado });
  }
}
