import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { acreditarOrden } from "@/lib/sipago/acreditacion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/sipago/webhook?t=<SIPAGO_WEBHOOK_TOKEN>
 *
 * Sipago avisa acá cuando una orden cambia de estado. El cuerpo llega así:
 *
 *   { "data": { "type": "Payment",
 *               "order":   { "uuid": "...", "status": "SUCCESS", "source": "api_checkout" },
 *               "payment": { "id": 1823, "status": "APPROVED", ... } } }
 *
 * **Este POST no viene firmado.** No hay HMAC, no hay secreto compartido, no hay
 * nada que distinga un aviso de Sipago de uno que escriba cualquiera que sepa la
 * URL. Encima el endpoint público `GET /api/v2/orders/{uuid}` de Sipago contesta
 * sin autenticación, así que los uuid tampoco son secretos.
 *
 * De ahí las dos defensas:
 *
 *  1. El token en el query string (`?t=`). Es un portero, no una prueba
 *     criptográfica: filtra el ruido y los escaneos, y se compara en tiempo
 *     constante para no filtrar el valor a fuerza de medir la respuesta.
 *
 *  2. Lo importante: el cuerpo del POST **no se usa para decidir nada**. De acá
 *     sale un solo dato —el uuid de la orden— y `acreditarOrden()` vuelve a
 *     preguntarle a Sipago cuál es el estado real. Un atacante que adivine la
 *     URL y postee "SUCCESS" no activa ninguna suscripción: activa una consulta.
 *
 * Códigos de respuesta: Sipago reintenta hasta 4 veces con ~2 minutos entre
 * intentos, así que un 5xx es "volvé a intentar" y un 200 es "listo, no
 * insistas". Una orden que no reconocemos contesta 200 a propósito — reintentar
 * no la va a hacer aparecer.
 */
export async function POST(req: NextRequest) {
  const esperado = process.env.SIPAGO_WEBHOOK_TOKEN;
  if (esperado) {
    const recibido = req.nextUrl.searchParams.get("t") || "";
    if (!comparacionSegura(recibido, esperado)) {
      console.warn("[sipago/webhook] token inválido");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const cuerpo = await req.json().catch(() => null);
  const uuid = cuerpo?.data?.order?.uuid;

  if (typeof uuid !== "string" || !uuid) {
    console.warn("[sipago/webhook] aviso sin uuid de orden");
    return NextResponse.json({ ok: true, ignorado: "sin uuid" });
  }

  try {
    const resultado = await acreditarOrden(uuid);
    if (resultado.estado === "sin_suscripcion") {
      // Puede ser una orden generada desde el portal de Sipago (un cobro por QR,
      // un link suelto) que no tiene nada que ver con la plataforma.
      console.warn(`[sipago/webhook] orden ${uuid} sin suscripción asociada`);
    }
    return NextResponse.json({ ok: true, resultado: resultado.estado });
  } catch (err) {
    // Un 500 acá es deliberado: le pide a Sipago que reintente. Si el error es
    // nuestro (base caída, timeout), el reintento nos salva; si no, se pierde
    // en 4 intentos y queda el camino de /suscripcion/resultado.
    console.error(`[sipago/webhook] falló procesando ${uuid}:`, err);
    return NextResponse.json({ error: "Error procesando el aviso" }, { status: 500 });
  }
}

/** Comparación en tiempo constante, tolerante a longitudes distintas. */
function comparacionSegura(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // `timingSafeEqual` tira si las longitudes difieren. Se compara igual contra
    // sí mismo para no devolver antes y delatar la longitud del secreto.
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}
