import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "node:crypto";
import { validarFirmaWebhook } from "@/lib/mercadopago/firma";

const SECRET = "test-secret-12345";

function firmar(dataId: string, requestId: string, ts: string): string {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hmac = crypto.createHmac("sha256", SECRET).update(manifest).digest("hex");
  return `ts=${ts},v1=${hmac}`;
}

describe("validarFirmaWebhook", () => {
  const prev = { ...process.env };
  beforeEach(() => {
    process.env.MP_WEBHOOK_SECRET = SECRET;
    process.env.MP_ENTORNO = "prod"; // modo estricto para este test
  });
  afterEach(() => {
    process.env = { ...prev };
  });

  it("valida firma correcta", () => {
    const dataId = "123";
    const xRequestId = "req-1";
    const ts = "1700000000";
    const xSignature = firmar(dataId, xRequestId, ts);
    const r = validarFirmaWebhook({ xSignature, xRequestId, dataId });
    expect(r.ok).toBe(true);
  });

  it("rechaza firma incorrecta", () => {
    const dataId = "123";
    const xRequestId = "req-1";
    const ts = "1700000000";
    const xSignature = `ts=${ts},v1=deadbeef00000000000000000000000000000000000000000000000000000000`;
    const r = validarFirmaWebhook({ xSignature, xRequestId, dataId });
    expect(r.ok).toBe(false);
  });

  it("rechaza si faltan headers", () => {
    const r = validarFirmaWebhook({ xSignature: null, xRequestId: "r", dataId: "1" });
    expect(r.ok).toBe(false);
  });

  it("permite x-signature=skip en modo test", () => {
    process.env.MP_ENTORNO = "test";
    const r = validarFirmaWebhook({ xSignature: "skip", xRequestId: null, dataId: null });
    expect(r.ok).toBe(true);
  });

  it("en test sin secret permite pasar", () => {
    process.env.MP_ENTORNO = "test";
    delete process.env.MP_WEBHOOK_SECRET;
    const r = validarFirmaWebhook({ xSignature: null, xRequestId: null, dataId: null });
    expect(r.ok).toBe(true);
  });
});
