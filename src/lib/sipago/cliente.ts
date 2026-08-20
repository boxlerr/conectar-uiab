import "server-only";

/**
 * Cliente de la API de Cobros de Sipago (Checkout).
 *
 * Sipago reemplaza a Mercado Pago como pasarela desde el 2026-08-20. La API es
 * la documentada en https://docs.sipago.coop y funciona en dos pasos:
 *
 *   1. `POST {api}/api/v2/orders` crea una *intención de pago* (entidad Order) y
 *      devuelve un link de checkout hospedado por Sipago.
 *   2. El socio paga ahí y Sipago avisa por `webhookUrl` y redirige al navegador.
 *
 * DOS COSAS QUE HAY QUE TENER PRESENTES, porque condicionan todo el diseño:
 *
 * - **El webhook no viene firmado.** Cualquiera que conozca la URL puede postear
 *   un "pago aprobado". Por eso `consultarOrden()` existe y por eso el webhook
 *   nunca activa una suscripción con lo que dice el cuerpo del POST: vuelve a
 *   preguntarle a Sipago por el estado real de la orden.
 *
 * - **No hay débito automático en esta API.** La orden es de un solo pago. La
 *   recurrencia se resuelve con el cron de /api/cron/suscripciones, que avisa el
 *   vencimiento y deja que el socio pague el ciclo siguiente. (El portal de
 *   Sipago sí tiene "Suscripciones" con débito recurrente, pero se gestiona a
 *   mano desde ahí y no notifica a la app.)
 */

/** ARS en ISO 4217 numérico. Es lo único que acepta la API. */
export const MONEDA_ARS = "032";

/** Estados que puede devolver Sipago para una orden. */
export type EstadoOrdenSipago =
  | "PENDING"
  | "SUCCESS"
  | "EXPIRED"
  | "FAILED"
  | "FAILED_CHECKOUT";

export interface PagoSipago {
  id: string | number | null;
  estado: string | null;
  codigoAutorizacion: string | null;
  numeroReferencia: string | null;
  /** Código de rechazo del emisor, cuando lo hay. Ej: "13" = importe inválido. */
  codigoError: string | null;
  /** Texto del emisor. Ej: "Verificar el sistema, error en el formato del campo importe". */
  mensajeError: string | null;
}

export interface OrdenSipago {
  uuid: string;
  estado: EstadoOrdenSipago;
  /** Total en CENTAVOS, tal cual lo devuelve la API. */
  montoCentavos: number | null;
  numeroOrden: string | null;
  urlCheckout: string | null;
  pago: PagoSipago | null;
  crudo: unknown;
}

export class ErrorSipago extends Error {
  constructor(mensaje: string, readonly status?: number, readonly cuerpo?: string) {
    super(mensaje);
    this.name = "ErrorSipago";
  }
}

// ─── Configuración ──────────────────────────────────────────────────────────

type Entorno = "test" | "prod";

/**
 * URLs por ambiente, de la sección Ambientes de la documentación. Se pueden
 * pisar con SIPAGO_API_URL / SIPAGO_AUTH_URL: Sipago entrega las credenciales
 * productivas por mail y no está de más poder cambiar el host sin tocar código.
 */
const URLS: Record<Entorno, { api: string; auth: string }> = {
  test: {
    api: "https://api-cabal.preprod.geopagos.com",
    auth: "https://auth.stg.geopagos.io",
  },
  prod: {
    api: "https://api.sipago.coop",
    auth: "https://auth.prd.geopagos.io",
  },
};

export function entornoSipago(): Entorno {
  return process.env.SIPAGO_ENTORNO === "prod" ? "prod" : "test";
}

function sinBarraFinal(url: string): string {
  return url.replace(/\/+$/, "");
}

export function urlApi(): string {
  return sinBarraFinal(process.env.SIPAGO_API_URL || URLS[entornoSipago()].api);
}

export function urlAuth(): string {
  return sinBarraFinal(process.env.SIPAGO_AUTH_URL || URLS[entornoSipago()].auth);
}

/**
 * ¿Está la pasarela configurada?
 *
 * Se consulta antes de intentar cobrar. Mientras la UIAB espera las credenciales
 * productivas esto devuelve `false` y el checkout cae al circuito manual
 * (coordinar el pago y registrarlo desde el panel) en vez de romperse.
 */
export function sipagoConfigurado(): boolean {
  return Boolean(process.env.SIPAGO_CLIENT_ID && process.env.SIPAGO_CLIENT_SECRET);
}

const TIMEOUT_MS = 15_000;

// ─── Token ──────────────────────────────────────────────────────────────────

let tokenEnCache: { valor: string; venceEn: number } | null = null;

/**
 * Cuándo vence el token, en milisegundos epoch.
 *
 * `expires_in` no es lo que dice la documentación. Ahí figura como una duración
 * en segundos ("3600"), pero el auth server de staging devuelve un epoch
 * absoluto (1787243794). Interpretar mal ese número es un bug silencioso: si se
 * toma el epoch como duración el token queda cacheado 56 años, y si se toma la
 * duración como epoch se pide un token nuevo en cada request. Se distinguen por
 * magnitud —una duración razonable nunca llega a mil millones— y en cualquier
 * caso se restan 60s de margen.
 */
function calcularVencimiento(expiresIn: unknown, ahora: number): number {
  const n = Number(expiresIn);
  if (!Number.isFinite(n) || n <= 0) return ahora + 5 * 60_000; // sin dato: 5 min
  const margen = 60_000;
  if (n > 1_000_000_000) return n * 1000 - margen; // epoch en segundos
  return ahora + n * 1000 - margen; // duración en segundos
}

/** Se exporta sólo para poder probarla. */
export const _calcularVencimiento = calcularVencimiento;

/** Vacía el cache del token. Para tests y para el caso de un 401 en caliente. */
export function olvidarToken(): void {
  tokenEnCache = null;
}

export async function obtenerToken(): Promise<string> {
  const ahora = Date.now();
  if (tokenEnCache && tokenEnCache.venceEn > ahora) return tokenEnCache.valor;

  const clientId = process.env.SIPAGO_CLIENT_ID;
  const clientSecret = process.env.SIPAGO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new ErrorSipago("Faltan SIPAGO_CLIENT_ID / SIPAGO_CLIENT_SECRET");
  }

  const res = await fetch(`${urlAuth()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "*",
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });

  const texto = await res.text();
  if (!res.ok) {
    throw new ErrorSipago("Sipago rechazó las credenciales", res.status, texto.slice(0, 500));
  }

  let json: { access_token?: string; expires_in?: unknown };
  try {
    json = JSON.parse(texto);
  } catch {
    throw new ErrorSipago("El auth server devolvió algo que no es JSON", res.status, texto.slice(0, 500));
  }

  if (!json.access_token) {
    throw new ErrorSipago("El auth server no devolvió access_token", res.status, texto.slice(0, 500));
  }

  tokenEnCache = { valor: json.access_token, venceEn: calcularVencimiento(json.expires_in, ahora) };
  return json.access_token;
}

// ─── Órdenes ────────────────────────────────────────────────────────────────

export interface ItemOrden {
  id: number;
  nombre: string;
  /** Precio unitario EN PESOS. Acá adentro se pasa a centavos. */
  precio: number;
  cantidad?: number;
}

export interface CrearOrdenInput {
  items: ItemOrden[];
  /**
   * A dónde vuelve el navegador. Sipago **sólo acepta HTTPS**, así que en
   * desarrollo (http://localhost:3000) se omiten: mandarlas hace que la API
   * rechace la orden entera y no se pueda probar nada localmente.
   */
  urlExito?: string;
  urlFallo?: string;
  urlWebhook?: string;
  /** Cuánto vive el link. Sin esto Sipago usa 10 minutos, que no alcanza. */
  minutosParaPagar?: number;
}

/** Sipago no acepta http:// en redirect_urls ni en webhookUrl. */
export function esHttps(url: string | undefined | null): url is string {
  return typeof url === "string" && url.startsWith("https://");
}

/**
 * `amount` es un entero donde los dos últimos dígitos son los centavos: para
 * cobrar $200,69 hay que mandar 20069. Los precios de la app son enteros en
 * pesos, así que esto es siempre ×100, pero el redondeo queda igual por si
 * mañana aparece un precio con decimales.
 */
export function aCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

export function aPesos(centavos: number): number {
  return centavos / 100;
}

/** Lo que devuelven los endpoints de órdenes, tipado flojo a propósito: no
 *  controlamos el contrato y ya vimos que la misma información viene en formas
 *  distintas según el endpoint. */
interface LinksSipago {
  checkout?: string | null;
}

interface PagoCrudo {
  id?: string | number | null;
  status?: string | null;
  authorization_code?: string | null;
  authorizationCode?: string | null;
  reference_number?: string | null;
  refNumber?: string | null;
  error?: { code?: string | null; message?: string | null; description?: string | null } | null;
}

interface AtributosOrden {
  uuid?: string;
  status?: string;
  orderNumber?: string | null;
  price?: { currency?: string; amount?: number } | null;
  links?: LinksSipago | null;
  payment?: PagoCrudo | null;
  payments?: PagoCrudo[] | null;
}

interface RespuestaOrden {
  data?: {
    attributes?: AtributosOrden | null;
    links?: LinksSipago | LinksSipago[] | null;
  } | null;
}

/**
 * El link de checkout aparece en dos lugares distintos del JSON según el
 * endpoint: en `data.attributes.links.checkout` al crear la orden, y la
 * documentación de PHP lo lee como `data.links.checkout` — donde en realidad
 * hay un array. Se prueban las tres formas en vez de elegir una y confiar.
 */
function extraerCheckout(cuerpo: RespuestaOrden): string | null {
  const deAtributos = cuerpo?.data?.attributes?.links?.checkout;
  if (deAtributos) return deAtributos;

  const links = cuerpo?.data?.links;
  if (Array.isArray(links)) return links[0]?.checkout ?? null;
  return links?.checkout ?? null;
}

function extraerPago(attrs: AtributosOrden): PagoSipago | null {
  // `payment` viene en null mientras no haya un pago aprobado; los intentos
  // rechazados quedan sólo en `payments`. Mirar únicamente `payment` era perder
  // de vista los rechazos.
  const p = attrs?.payment ?? (Array.isArray(attrs?.payments) ? attrs.payments[0] : null);
  if (!p) return null;
  return {
    id: p.id ?? null,
    estado: p.status ?? null,
    // La API mezcla snake_case (GET orden) y camelCase (webhook) para lo mismo.
    codigoAutorizacion: p.authorization_code ?? p.authorizationCode ?? null,
    numeroReferencia: p.reference_number ?? p.refNumber ?? null,
    codigoError: p.error?.code ?? null,
    mensajeError: p.error?.message ?? p.error?.description ?? null,
  };
}

function aOrden(cuerpo: RespuestaOrden): OrdenSipago {
  const attrs: AtributosOrden = cuerpo?.data?.attributes ?? {};
  return {
    uuid: attrs.uuid ?? "",
    estado: (attrs.status ?? "PENDING") as EstadoOrdenSipago,
    montoCentavos: typeof attrs?.price?.amount === "number" ? attrs.price.amount : null,
    numeroOrden: attrs.orderNumber ?? null,
    urlCheckout: extraerCheckout(cuerpo),
    pago: extraerPago(attrs),
    crudo: cuerpo,
  };
}

/** Crea la intención de pago y devuelve el link de checkout. */
export async function crearOrden(input: CrearOrdenInput): Promise<OrdenSipago> {
  const token = await obtenerToken();

  const redirecciones =
    esHttps(input.urlExito) || esHttps(input.urlFallo)
      ? {
          redirect_urls: {
            success: esHttps(input.urlExito) ? input.urlExito : null,
            failed: esHttps(input.urlFallo) ? input.urlFallo : null,
          },
        }
      : {};

  const cuerpo = {
    data: {
      attributes: {
        ...redirecciones,
        ...(esHttps(input.urlWebhook) ? { webhookUrl: input.urlWebhook } : {}),
        currency: MONEDA_ARS,
        expireLimitMinutes: input.minutosParaPagar ?? 1440,
        items: input.items.map((i) => ({
          id: i.id,
          name: i.nombre,
          unitPrice: { currency: MONEDA_ARS, amount: aCentavos(i.precio) },
          quantity: i.cantidad ?? 1,
        })),
      },
    },
  };

  const res = await fetch(`${urlApi()}/api/v2/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    },
    body: JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });

  const texto = await res.text();
  if (!res.ok) {
    // Un token vencido antes de tiempo no puede dejar la app sin cobrar hasta
    // que se recicle la instancia: se tira el cache para que el próximo intento
    // arranque limpio.
    if (res.status === 401) olvidarToken();
    throw new ErrorSipago("Sipago no pudo crear la orden", res.status, texto.slice(0, 500));
  }

  const orden = aOrden(JSON.parse(texto));
  if (!orden.uuid || !orden.urlCheckout) {
    throw new ErrorSipago("Sipago creó la orden sin uuid o sin link de checkout", res.status, texto.slice(0, 500));
  }
  return orden;
}

/**
 * El estado REAL de una orden, preguntado a Sipago.
 *
 * Es la única fuente que se usa para dar por pagada una suscripción. El webhook
 * sólo sirve para saber que hay algo que mirar.
 */
export async function consultarOrden(uuid: string): Promise<OrdenSipago> {
  const token = await obtenerToken();

  const res = await fetch(`${urlApi()}/api/v2/orders/${encodeURIComponent(uuid)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });

  const texto = await res.text();
  if (!res.ok) {
    if (res.status === 401) olvidarToken();
    throw new ErrorSipago("Sipago no pudo devolver la orden", res.status, texto.slice(0, 500));
  }
  return aOrden(JSON.parse(texto));
}

/** ¿La orden terminó con un pago efectivamente acreditado? */
export function estaPagada(orden: OrdenSipago): boolean {
  return orden.estado === "SUCCESS" && orden.pago?.estado === "APPROVED";
}

/** ¿La orden terminó mal y ya no se va a cobrar? */
export function estaFallida(orden: OrdenSipago): boolean {
  return orden.estado === "EXPIRED" || orden.estado === "FAILED" || orden.estado === "FAILED_CHECKOUT";
}

/** Estados con los que el emisor marca un intento que no prosperó. */
const RECHAZOS = new Set(["DENIED", "REJECTED", "ERROR", "FAILED"]);

/**
 * ¿Le rechazaron la tarjeta pero todavía puede reintentar en el mismo link?
 *
 * Sipago admite hasta `failedPaymentQuantityLimit` intentos fallidos (3 por
 * defecto), así que después de un rechazo la ORDEN sigue en PENDING y sólo el
 * PAGO queda en DENIED. Mirar nada más que el estado de la orden —que es lo que
 * hacía `estaFallida`— dejaba a la plataforma diciéndole "tu pago se está
 * acreditando" a alguien a quien le acababan de rechazar la tarjeta.
 *
 * Se descubrió con un rechazo real: código 13, "error en el formato del campo
 * importe", que es como el emisor contesta un importe que no acepta.
 */
export function tieneIntentoRechazado(orden: OrdenSipago): boolean {
  if (estaPagada(orden) || estaFallida(orden)) return false;
  const estado = orden.pago?.estado?.toUpperCase();
  return Boolean(estado && RECHAZOS.has(estado));
}
