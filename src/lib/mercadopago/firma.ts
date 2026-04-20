/**
 * Validación de firma HMAC para webhooks de Mercado Pago.
 * Docs: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks#editor_5
 *
 * El header `x-signature` viene como: "ts=1700000000,v1=abc123..."
 * Se reconstruye el manifest `id:<dataId>;request-id:<xRequestId>;ts:<ts>;` y se
 * compara con HMAC-SHA256(manifest, MP_WEBHOOK_SECRET).
 */

import crypto from "node:crypto";
import { mpEntorno } from "./cliente";

export interface ValidarFirmaInput {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}

export function validarFirmaWebhook({
  xSignature,
  xRequestId,
  dataId,
}: ValidarFirmaInput): { ok: boolean; razon?: string } {
  const secret = process.env.MP_WEBHOOK_SECRET;

  // En test, si no hay secret configurado o se manda header "skip",
  // se permite para facilitar dev/smoke tests. En prod, siempre estricto.
  if (mpEntorno() === "test" && (xSignature === "skip" || !secret)) {
    return { ok: true };
  }

  if (!secret) return { ok: false, razon: "MP_WEBHOOK_SECRET no configurado" };
  if (!xSignature) return { ok: false, razon: "falta header x-signature" };
  if (!xRequestId) return { ok: false, razon: "falta header x-request-id" };
  if (!dataId) return { ok: false, razon: "falta data.id" };

  // Parse "ts=...,v1=..."
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    })
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return { ok: false, razon: "x-signature mal formado" };

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const esperado = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  const ok =
    esperado.length === v1.length &&
    crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(v1));

  return ok ? { ok: true } : { ok: false, razon: "firma no coincide" };
}
