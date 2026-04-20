import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { crearPreapproval, cancelarPreapproval, obtenerPayment } from "@/lib/mercadopago/cliente";

const OK_PREAPPROVAL = {
  id: "pa-123",
  init_point: "https://mp.example/checkout",
  status: "pending",
  external_reference: "suscripcion:abc",
  auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: 1000, currency_id: "ARS" },
  date_created: "2026-04-20T12:00:00Z",
  last_modified: "2026-04-20T12:00:00Z",
};

describe("cliente Mercado Pago", () => {
  const prev = { ...process.env };
  beforeEach(() => {
    process.env.MP_ACCESS_TOKEN = "TEST-token";
    vi.restoreAllMocks();
  });
  afterEach(() => {
    process.env = { ...prev };
    vi.restoreAllMocks();
  });

  it("crearPreapproval manda POST con Bearer + idempotency-key", async () => {
    const spy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(OK_PREAPPROVAL),
    } as any);

    const res = await crearPreapproval(
      {
        reason: "Plan", external_reference: "suscripcion:abc", payer_email: "a@b.com",
        back_url: "https://uiab/back",
        auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: 1000, currency_id: "ARS" },
      },
      { idempotencyKey: "key-1" }
    );

    expect(res.id).toBe("pa-123");
    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.mercadopago.com/preapproval");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer TEST-token");
    expect(headers["X-Idempotency-Key"]).toBe("key-1");
  });

  it("cancelarPreapproval hace PUT con status cancelled", async () => {
    const spy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true, status: 200, text: async () => JSON.stringify({ ...OK_PREAPPROVAL, status: "cancelled" }),
    } as any);

    const r = await cancelarPreapproval("pa-123");
    expect(r.status).toBe("cancelled");
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("PUT");
    expect(init.body).toContain("cancelled");
  });

  it("propaga errores 4xx/5xx", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false, status: 400, text: async () => JSON.stringify({ message: "bad" }),
    } as any);
    await expect(obtenerPayment("1")).rejects.toThrow(/400/);
  });

  it("arroja si falta MP_ACCESS_TOKEN", async () => {
    delete process.env.MP_ACCESS_TOKEN;
    await expect(obtenerPayment("1")).rejects.toThrow(/MP_ACCESS_TOKEN/);
  });
});
