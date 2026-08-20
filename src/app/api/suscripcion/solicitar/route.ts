import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { leerPrecios } from "@/lib/suscripciones/precios";
import { montoPorCiclo, nombrePlan, type CicloSuscripcion } from "@/lib/suscripciones/modelo";
import { enviarEmail, emailAdmin, appUrl } from "@/lib/email/cliente";
import { renderEmailBase } from "@/lib/email/plantillas";
import { crearOrden, sipagoConfigurado } from "@/lib/sipago/cliente";
import {
  urlPlan,
  fechaCobroAnualEnPalabras,
  primerCobroAnualEstimado,
} from "@/lib/sipago/planes";

export const runtime = "nodejs";

/**
 * POST /api/suscripcion/solicitar  →  { ciclo: 'mensual' | 'anual' }
 *
 * Arranca el cobro de la suscripción. Devuelve una de cuatro cosas:
 *
 *   { cortesia: true }              la socia UIAB no paga; que entre y listo.
 *   { suscripcion_url, cuit }       plan recurrente: deja la tarjeta adherida.
 *   { init_point: "https://..." }   Checkout de Sipago: paga el ciclo una vez.
 *   { manual: true }                no hay pasarela: se coordina por fuera.
 *
 * El primero que se ofrece es el plan recurrente, porque es el que resuelve el
 * problema real de la UIAB: cobrar sin perseguir a nadie todos los meses. El
 * Checkout queda para los ciclos sin plan y para regularizar mora.
 *
 * El tercer caso no es un error, es el estado en el que estuvo la plataforma
 * entre que Mercado Pago se dio de baja (2026-08-14) y que Sipago entregó las
 * credenciales productivas. Se conserva porque también es la red cuando Sipago
 * no contesta: entre dejar al socio con "Error inesperado" y anotarle la
 * intención avisándole al admin para que lo llamen, lo segundo cobra y lo
 * primero no.
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
  //
  // Contesta 200 y no 400 a propósito. Con el 400 el checkout mostraba el texto
  // adentro de un cartel de error y la dejaba en la misma pantalla: el único
  // botón que tenía la traía de vuelta acá, y el gate no la dejaba entrar. Con
  // 200 + `cortesia`, la página la manda al panel, que es donde tiene que estar.
  if (sus && (sus.metodo_pago === "cortesia" || Number(sus.monto) === 0) && sus.estado === "activa") {
    return NextResponse.json({
      ok: true,
      cortesia: true,
      mensaje: "Tu acceso es de cortesía por ser socia de la UIAB: no tenés que contratar nada.",
    });
  }

  // El estado NO se pisa a ciegas. Una suscripción `activa` que pasa por acá es
  // alguien renovando antes de tiempo o cambiando de método, y bajarla a
  // `pendiente_pago` la deja afuera de la plataforma en el acto: ese estado no
  // habilita el acceso (ver ESTADOS_CON_ACCESO). O sea que el socio que estaba
  // al día y tocaba "Cambiar método" se autoexpulsaba.
  //
  // `en_mora` tampoco se toca: mientras corre la gracia sigue entrando, y
  // moverla acá le sacaría los días que le quedan por haber intentado pagar.
  const conservaEstado = sus?.estado === "activa" || sus?.estado === "en_mora";

  const base = {
    [columna]: entidadId,
    ciclo,
    monto,
    moneda: "ARS",
    nombre_plan: nombrePlan(ciclo),
    ...(conservaEstado ? {} : { estado: "pendiente_pago" }),
    actualizado_en: new Date().toISOString(),
  };

  // ─── Camino 1: plan recurrente (débito automático) ────────────────────────
  //
  // Acá no se crea nada en Sipago: el plan ya existe en el portal y el socio va
  // a un link fijo. Lo único que hacemos es dejar anotado que lo mandamos, para
  // que la conciliación después sepa a quién buscar.
  const planUrl = urlPlan(ciclo);
  if (planUrl) {
    const cambios = { ...base, metodo_pago: "sipago_suscripcion" };
    const { error } = sus
      ? await admin.from("suscripciones").update(cambios).eq("id", sus.id)
      : await admin.from("suscripciones").insert(cambios);

    if (error) {
      console.error("[suscripcion/solicitar] no se pudo anotar la suscripción:", error.message);
      return NextResponse.json({ error: "No pudimos registrar tu elección. Probá de nuevo." }, { status: 500 });
    }

    // El CUIT se le muestra al socio porque el checkout del plan se lo va a
    // pedir, y es EL dato con el que después lo vamos a encontrar en el reporte
    // de Sipago. Si lo tipea distinto al que tenemos, su pago queda huérfano.
    // El anual de Sipago cobra en una fecha fija del calendario, igual para
    // todos, y prorratea el primer cobro. Si no se lo decimos, el socio ve
    // "$500.000 / año" en pantalla y le debitan otra cosa.
    const prorrateo =
      ciclo === "anual"
        ? { fechaCobro: fechaCobroAnualEnPalabras(), primerCobro: primerCobroAnualEstimado(monto) }
        : null;

    return NextResponse.json({
      ok: true,
      ciclo,
      monto,
      suscripcion_url: planUrl,
      cuit: await cuitDeLaEntidad(admin, rol, entidadId),
      prorrateo,
    });
  }

  // ─── Camino 2: Checkout (un pago suelto) ──────────────────────────────────
  if (sipagoConfigurado()) {
    try {
      const orden = await crearOrden({
        items: [{ id: ciclo === "anual" ? 2 : 1, nombre: nombrePlan(ciclo), precio: monto }],
        urlExito: `${appUrl()}/suscripcion/resultado?ref=ok`,
        urlFallo: `${appUrl()}/suscripcion/resultado?ref=fallo`,
        urlWebhook: urlWebhook(),
        // 24 horas. El default de Sipago son 10 minutos: alcanza para el que
        // paga en el momento y deja afuera al que abre el mail más tarde.
        minutosParaPagar: 1440,
      });

      const cambios = { ...base, metodo_pago: "sipago", sipago_order_uuid: orden.uuid };
      const { error } = sus
        ? await admin.from("suscripciones").update(cambios).eq("id", sus.id)
        : await admin.from("suscripciones").insert(cambios);

      if (error) {
        // La orden ya existe en Sipago pero no la podemos asociar a nadie: si el
        // socio pagara, el webhook no encontraría a quién acreditarle. Mejor no
        // ofrecer ese link.
        console.error("[suscripcion/solicitar] no se pudo guardar la orden:", error.message);
        throw new Error(error.message);
      }

      return NextResponse.json({ ok: true, ciclo, monto, init_point: orden.urlCheckout, orden: orden.uuid });
    } catch (err) {
      console.error("[suscripcion/solicitar] Sipago falló, se cae al circuito manual:", err);
      // Sigue al camino manual de abajo.
    }
  }

  // ─── Camino manual ────────────────────────────────────────────────────────
  const cambios = { ...base, metodo_pago: "transferencia" };
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

  return NextResponse.json({ ok: true, ciclo, monto, manual: true });
}

/**
 * El CUIT de la ficha, para mostrárselo al socio antes de mandarlo a Sipago.
 * Si no lo tenemos se devuelve null y la pantalla simplemente no lo muestra.
 */
async function cuitDeLaEntidad(
  admin: ReturnType<typeof createAdminClient>,
  rol: "company" | "provider",
  entidadId: string
): Promise<string | null> {
  const tabla = rol === "company" ? "empresas" : "proveedores";
  const { data } = await admin.from(tabla).select("cuit").eq("id", entidadId).maybeSingle();
  return (data?.cuit as string | null) ?? null;
}

/** La URL del webhook con su token. Sin token configurado, no se manda. */
function urlWebhook(): string | undefined {
  const token = process.env.SIPAGO_WEBHOOK_TOKEN;
  if (!token) return undefined;
  return `${appUrl()}/api/sipago/webhook?t=${encodeURIComponent(token)}`;
}
