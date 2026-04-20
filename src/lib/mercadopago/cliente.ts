/**
 * Cliente liviano de la API de Mercado Pago (solo fetch, sin SDK).
 * Cubre los endpoints que UIAB Conecta necesita para suscripciones:
 *  - POST /preapproval            → crear suscripción
 *  - GET  /preapproval/:id        → consultar
 *  - PUT  /preapproval/:id        → modificar / cancelar
 *  - GET  /v1/payments/:id        → detalle de un pago
 *
 * Las credenciales se leen de env en cada request para permitir hot-swap
 * entre TEST y PROD sin reiniciar.
 */

const MP_API = "https://api.mercadopago.com";

function accessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN no configurado en el entorno");
  return token;
}

export function mpEntorno(): "test" | "prod" {
  return (process.env.MP_ENTORNO as any) === "prod" ? "prod" : "test";
}

async function mpFetch<T = unknown>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {}
): Promise<T> {
  const { idempotencyKey, ...rest } = init;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken()}`,
    "Content-Type": "application/json",
    ...((rest.headers as Record<string, string>) || {}),
  };
  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;

  const res = await fetch(`${MP_API}${path}`, { ...rest, headers });
  const body = await res.text();
  let parsed: any = null;
  try {
    parsed = body ? JSON.parse(body) : null;
  } catch {
    parsed = body;
  }
  if (!res.ok) {
    const err = new Error(
      `MP ${init.method || "GET"} ${path} → ${res.status}: ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`
    ) as Error & { status?: number; body?: unknown };
    err.status = res.status;
    err.body = parsed;
    throw err;
  }
  return parsed as T;
}

// ---------- Preapproval (suscripción) ----------

export interface CrearPreapprovalInput {
  reason: string;
  external_reference: string;
  payer_email: string;
  back_url: string;
  auto_recurring: {
    frequency: number;
    frequency_type: "months" | "days";
    transaction_amount: number;
    currency_id: "ARS";
    start_date?: string;
    end_date?: string;
  };
  status?: "pending" | "authorized";
  notification_url?: string;
}

export interface PreapprovalResponse {
  id: string;
  init_point: string;
  status: string;
  payer_id?: number;
  payer_email?: string;
  external_reference: string;
  auto_recurring: CrearPreapprovalInput["auto_recurring"];
  next_payment_date?: string;
  date_created: string;
  last_modified: string;
}

export async function crearPreapproval(
  input: CrearPreapprovalInput,
  opts: { idempotencyKey?: string } = {}
): Promise<PreapprovalResponse> {
  return mpFetch<PreapprovalResponse>("/preapproval", {
    method: "POST",
    body: JSON.stringify(input),
    idempotencyKey: opts.idempotencyKey,
  });
}

export async function obtenerPreapproval(id: string): Promise<PreapprovalResponse> {
  return mpFetch<PreapprovalResponse>(`/preapproval/${encodeURIComponent(id)}`);
}

export async function cancelarPreapproval(id: string): Promise<PreapprovalResponse> {
  return mpFetch<PreapprovalResponse>(`/preapproval/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ status: "cancelled" }),
  });
}

// ---------- Payments ----------

export interface PaymentResponse {
  id: number;
  status: "approved" | "pending" | "rejected" | "in_process" | "refunded" | string;
  status_detail: string;
  transaction_amount: number;
  currency_id: string;
  date_approved: string | null;
  date_created: string;
  external_reference: string | null;
  payment_method_id: string;
  payment_type_id: string;
  payer: { email?: string; id?: string | number };
  metadata?: Record<string, any>;
}

export async function obtenerPayment(id: string | number): Promise<PaymentResponse> {
  return mpFetch<PaymentResponse>(`/v1/payments/${id}`);
}
