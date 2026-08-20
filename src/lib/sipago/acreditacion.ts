import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail, emailAdmin, appUrl } from "@/lib/email/cliente";
import {
  plantillaPagoConfirmado,
  plantillaPagoConfirmadoAdmin,
  plantillaPagoFallido,
} from "@/lib/email/plantillas-suscripciones";
import { notificarEntidad } from "@/modulos/notificaciones/acciones";
import { proximoCobro, nombrePlan, type CicloSuscripcion } from "@/lib/suscripciones/modelo";
import {
  consultarOrden,
  estaPagada,
  estaFallida,
  tieneIntentoRechazado,
  aCentavos,
  aPesos,
  type OrdenSipago,
} from "./cliente";

/**
 * Acreditar un pago de Sipago: pasar de "el socio dice que pagó" a
 * "la suscripción está activa".
 *
 * Vive acá y no adentro del webhook a propósito, porque hay DOS caminos por los
 * que nos enteramos de un pago y los dos tienen que terminar igual:
 *
 *   - El webhook de Sipago (`/api/sipago/webhook`).
 *   - La vuelta del socio al sitio (`/suscripcion/resultado`), que consulta.
 *
 * Que haya dos no es redundancia de más: el webhook de Sipago no viene firmado
 * y no tiene garantía de entrega más allá de 4 reintentos en ~8 minutos. Si esos
 * cuatro fallan —un deploy, un pico de latencia— el socio pagó y la plataforma
 * nunca se entera. Con el segundo camino, apenas vuelve del checkout la orden se
 * verifica igual.
 *
 * Y por eso mismo TODO pasa por `consultarOrden()`: lo que llega en el cuerpo
 * del webhook es un aviso, no una prueba. La única fuente de verdad sobre si un
 * pago existe es preguntárselo a Sipago.
 */

export type ResultadoAcreditacion =
  | { estado: "acreditado"; suscripcionId: string; yaEstaba: boolean }
  | { estado: "pendiente" }
  /** Le rechazaron la tarjeta, pero el link sigue vivo y puede reintentar. */
  | { estado: "rechazado"; motivo: string; puedeReintentar: true }
  | { estado: "fallido"; motivo: string }
  | { estado: "sin_suscripcion" }
  | { estado: "monto_no_coincide"; esperado: number; recibido: number };

interface FilaSuscripcion {
  id: string;
  empresa_id: string | null;
  proveedor_id: string | null;
  monto: number | string | null;
  ciclo: string | null;
  nombre_plan: string | null;
  estado: string | null;
  proximo_cobro_en?: string | null;
}

/**
 * Desde cuándo cuenta el ciclo que se acaba de pagar.
 *
 * Si al socio todavía le quedaban días, el ciclo nuevo arranca cuando termina el
 * viejo. Contar desde hoy le regalaría a la UIAB los días que ya había pagado:
 * el que renueva una semana antes del vencimiento perdería esa semana por
 * adelantarse, que es exactamente lo contrario de lo que queremos premiar.
 *
 * Si la fecha ya pasó (o no hay), arranca hoy.
 */
export function desdeCuandoCorre(proximoCobroActual: string | null | undefined, ahora: Date): Date {
  if (!proximoCobroActual) return ahora;
  const vigente = new Date(proximoCobroActual);
  if (Number.isNaN(vigente.getTime())) return ahora;
  return vigente > ahora ? vigente : ahora;
}

export async function acreditarOrden(uuid: string): Promise<ResultadoAcreditacion> {
  const admin = createAdminClient();

  const { data: sus } = await admin
    .from("suscripciones")
    .select("id, empresa_id, proveedor_id, monto, ciclo, nombre_plan, estado, proximo_cobro_en")
    .eq("sipago_order_uuid", uuid)
    .maybeSingle();

  if (!sus) return { estado: "sin_suscripcion" };
  const suscripcion = sus as FilaSuscripcion;

  const orden = await consultarOrden(uuid);

  if (estaPagada(orden)) return acreditarPago(admin, suscripcion, orden);
  if (estaFallida(orden)) return registrarRechazo(admin, suscripcion, orden);

  // Tarjeta rechazada pero el link todavía sirve. NO se registra el intento ni
  // se manda mail: el socio está mirando la pantalla y puede volver a probar en
  // el momento. Lo único que importa es no mentirle diciéndole que su pago se
  // está acreditando.
  if (tieneIntentoRechazado(orden)) {
    return {
      estado: "rechazado",
      motivo: motivoDelRechazo(orden),
      puedeReintentar: true,
    };
  }

  return { estado: "pendiente" };
}

// ─── Pago aprobado ──────────────────────────────────────────────────────────

async function acreditarPago(
  admin: ReturnType<typeof createAdminClient>,
  sus: FilaSuscripcion,
  orden: OrdenSipago
): Promise<ResultadoAcreditacion> {
  const ciclo: CicloSuscripcion = sus.ciclo === "anual" ? "anual" : "mensual";
  const montoEsperado = Number(sus.monto) || 0;

  // El monto de la orden se compara con el de la suscripción antes de activar
  // nada. Sipago no permite atar la orden a un identificador nuestro, así que la
  // única forma de detectar que alguien pagó $1 por un plan de $50.000 —o que
  // quedó pegada una orden vieja de un precio anterior— es mirar el importe.
  const recibidoCentavos = orden.montoCentavos;
  if (recibidoCentavos != null && montoEsperado > 0 && recibidoCentavos !== aCentavos(montoEsperado)) {
    console.error(
      `[sipago] la orden ${orden.uuid} pagó ${aPesos(recibidoCentavos)} y la suscripción ${sus.id} vale ${montoEsperado}`
    );
    await avisarAlAdmin(
      "Un pago de Sipago no coincide con el monto de la suscripción",
      `La orden ${orden.uuid} se pagó por $${aPesos(recibidoCentavos).toLocaleString("es-AR")} pero la suscripción ` +
        `figura en $${montoEsperado.toLocaleString("es-AR")}. No se activó: hay que revisarla a mano en el panel.`
    );
    return { estado: "monto_no_coincide", esperado: montoEsperado, recibido: aPesos(recibidoCentavos) };
  }

  // Idempotencia. Sipago reintenta el webhook hasta 4 veces y además la página
  // de resultado consulta por su cuenta: sin esto, un mismo pago podía quedar
  // cargado varias veces y correr el vencimiento un mes por cada reintento.
  const { data: yaCargado } = await admin
    .from("pagos_suscripciones")
    .select("id")
    .eq("sipago_order_uuid", orden.uuid)
    .eq("estado", "aprobado")
    .limit(1)
    .maybeSingle();

  if (yaCargado) return { estado: "acreditado", suscripcionId: sus.id, yaEstaba: true };

  const pagadoEn = new Date();
  const proximo = proximoCobro(ciclo, desdeCuandoCorre(sus.proximo_cobro_en, pagadoEn)).toISOString();
  const referencia = orden.pago?.numeroReferencia || orden.numeroOrden || orden.uuid;

  const { error: errPago } = await admin.from("pagos_suscripciones").insert({
    suscripcion_id: sus.id,
    empresa_id: sus.empresa_id,
    proveedor_id: sus.proveedor_id,
    monto: montoEsperado,
    moneda: "ARS",
    estado: "aprobado",
    metodo_pago: "sipago",
    tipo_pago: "automatico",
    ciclo,
    sipago_order_uuid: orden.uuid,
    sipago_payment_id: orden.pago?.id != null ? String(orden.pago.id) : null,
    external_reference: referencia,
    payload: orden.crudo as object,
    pagado_en: pagadoEn.toISOString(),
  });

  if (errPago) {
    // 23505 = unique_violation: otro camino (webhook vs. vuelta del socio) ganó
    // la carrera y ya lo cargó. No es un error, es exactamente lo que el índice
    // único está para hacer.
    if ((errPago as { code?: string }).code === "23505") {
      return { estado: "acreditado", suscripcionId: sus.id, yaEstaba: true };
    }
    console.error("[sipago] no se pudo registrar el pago:", errPago.message);
    throw new Error(`No se pudo registrar el pago: ${errPago.message}`);
  }

  await admin
    .from("suscripciones")
    .update({
      estado: "activa",
      metodo_pago: "sipago",
      ciclo,
      nombre_plan: sus.nombre_plan || nombrePlan(ciclo),
      proximo_cobro_en: proximo,
      gracia_hasta: null,
      inicia_en: pagadoEn.toISOString(),
      cancelada_en: null,
      finaliza_en: null,
      ultima_notificacion_en: null,
      actualizado_en: pagadoEn.toISOString(),
    })
    .eq("id", sus.id);

  const dest = await destinatario(admin, sus);
  if (dest) {
    const p = plantillaPagoConfirmado({
      nombre: dest.nombre,
      email: dest.email,
      entidad: dest.entidad,
      plan: sus.nombre_plan || nombrePlan(ciclo),
      monto: montoEsperado,
      ciclo,
      pagadoEn,
      proximoCobro: proximo,
      metodoPago: "sipago",
      referenciaPago: referencia,
    });
    await enviarEmail({ para: dest.email, asunto: p.asunto, html: p.html, texto: p.texto }).catch((e) =>
      console.error("[sipago] no se pudo avisar al socio:", e)
    );

    const pa = plantillaPagoConfirmadoAdmin({
      nombre: dest.nombre,
      email: dest.email,
      entidad: dest.entidad,
      plan: sus.nombre_plan || nombrePlan(ciclo),
      monto: montoEsperado,
      ciclo,
      pagadoEn,
      referenciaPago: referencia,
    });
    await enviarEmail({ para: emailAdmin(), asunto: pa.asunto, html: pa.html, texto: pa.texto }).catch((e) =>
      console.error("[sipago] no se pudo avisar al admin:", e)
    );
  }

  await notificarEntidad({
    empresaId: sus.empresa_id,
    proveedorId: sus.proveedor_id,
    tipo: "pago_confirmado",
    titulo: "Recibimos tu pago",
    mensaje: "Acreditamos tu pago y tu suscripción quedó activa.",
    url: "/perfil/suscripcion",
  });

  return { estado: "acreditado", suscripcionId: sus.id, yaEstaba: false };
}

// ─── Pago rechazado o vencido ───────────────────────────────────────────────

/**
 * Qué decirle al socio cuando el emisor rechaza.
 *
 * El mensaje de Sipago está escrito para un operador de comercio ("Verificar el
 * sistema, error en el formato del campo importe"), no para quien está pagando.
 * Los que se pueden traducir a algo accionable se traducen; el resto se muestra
 * tal cual, que es mejor que un "error desconocido".
 */
const RECHAZOS_CONOCIDOS: Record<string, string> = {
  "13": "El importe no fue aceptado por el emisor de la tarjeta.",
  "51": "La tarjeta no tiene fondos suficientes.",
  "54": "La tarjeta está vencida.",
  "57": "El emisor no habilita este tipo de operación para esta tarjeta.",
};

function motivoDelRechazo(orden: OrdenSipago): string {
  const codigo = orden.pago?.codigoError;
  if (codigo && RECHAZOS_CONOCIDOS[codigo]) return RECHAZOS_CONOCIDOS[codigo];
  return orden.pago?.mensajeError || "El emisor de la tarjeta rechazó el pago.";
}

const MOTIVOS: Record<string, string> = {
  EXPIRED: "El link de pago venció antes de completarse.",
  FAILED: "No se pudo generar el pago.",
  FAILED_CHECKOUT: "El pago fue rechazado durante el checkout.",
};

async function registrarRechazo(
  admin: ReturnType<typeof createAdminClient>,
  sus: FilaSuscripcion,
  orden: OrdenSipago
): Promise<ResultadoAcreditacion> {
  const motivo = orden.pago?.codigoError
    ? motivoDelRechazo(orden)
    : (MOTIVOS[orden.estado] ?? "El pago no se completó.");
  const ciclo: CicloSuscripcion = sus.ciclo === "anual" ? "anual" : "mensual";

  const { data: yaCargado } = await admin
    .from("pagos_suscripciones")
    .select("id")
    .eq("sipago_order_uuid", orden.uuid)
    .limit(1)
    .maybeSingle();

  if (!yaCargado) {
    await admin.from("pagos_suscripciones").insert({
      suscripcion_id: sus.id,
      empresa_id: sus.empresa_id,
      proveedor_id: sus.proveedor_id,
      monto: Number(sus.monto) || 0,
      moneda: "ARS",
      estado: "rechazado",
      metodo_pago: "sipago",
      tipo_pago: "automatico",
      ciclo,
      sipago_order_uuid: orden.uuid,
      sipago_payment_id: orden.pago?.id != null ? String(orden.pago.id) : null,
      payload: orden.crudo as object,
      nota: motivo,
    });

    const dest = await destinatario(admin, sus);
    if (dest) {
      const p = plantillaPagoFallido({
        nombre: dest.nombre,
        email: dest.email,
        entidad: dest.entidad,
        plan: sus.nombre_plan || nombrePlan(ciclo),
        monto: Number(sus.monto) || 0,
        ciclo,
        motivo,
      });
      await enviarEmail({ para: dest.email, asunto: p.asunto, html: p.html, texto: p.texto }).catch((e) =>
        console.error("[sipago] no se pudo avisar el rechazo:", e)
      );
    }

    await notificarEntidad({
      empresaId: sus.empresa_id,
      proveedorId: sus.proveedor_id,
      tipo: "pago_fallido",
      titulo: "No pudimos procesar tu pago",
      mensaje: motivo,
      url: "/perfil/suscripcion",
    });
  }

  // La suscripción NO se toca. Un pago que no salió la deja donde estaba
  // —pendiente_pago si nunca pagó, activa si está al día— y de mover los estados
  // por vencimiento se ocupa el cron, que es quien tiene el período de gracia.
  return { estado: "fallido", motivo };
}

// ─── Auxiliares ─────────────────────────────────────────────────────────────

async function destinatario(
  admin: ReturnType<typeof createAdminClient>,
  sus: FilaSuscripcion
): Promise<{ email: string; nombre: string; entidad: "empresa" | "particular" } | null> {
  if (sus.empresa_id) {
    const { data } = await admin.from("empresas").select("email, razon_social").eq("id", sus.empresa_id).maybeSingle();
    if (!data?.email) return null;
    return { email: data.email, nombre: data.razon_social || "", entidad: "empresa" };
  }
  if (sus.proveedor_id) {
    const { data } = await admin
      .from("proveedores")
      .select("email, nombre, apellido")
      .eq("id", sus.proveedor_id)
      .maybeSingle();
    if (!data?.email) return null;
    return {
      email: data.email,
      nombre: [data.nombre, data.apellido].filter(Boolean).join(" "),
      entidad: "particular",
    };
  }
  return null;
}

async function avisarAlAdmin(asunto: string, detalle: string): Promise<void> {
  const { renderEmailBase } = await import("@/lib/email/plantillas");
  try {
    await enviarEmail({
      para: emailAdmin(),
      asunto,
      html: renderEmailBase({
        preheader: "Revisar un pago de Sipago",
        titulo: "Hay un pago para revisar",
        intro: "Sipago informó un pago que no encaja con lo que esperábamos.",
        cuerpo: `<p style="margin:0 0 16px 0;">${detalle}</p>`,
        cta: { etiqueta: "Ver suscripciones", href: `${appUrl()}/admin/suscripciones` },
      }),
      texto: detalle,
    });
  } catch (e) {
    console.error("[sipago] no se pudo avisar al admin:", e);
  }
}
