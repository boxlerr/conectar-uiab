import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  _calcularVencimiento,
  aCentavos,
  aPesos,
  crearOrden,
  consultarOrden,
  estaFallida,
  estaPagada,
  tieneIntentoRechazado,
  esHttps,
  entornoSipago,
  olvidarToken,
  sipagoConfigurado,
  urlApi,
  urlAuth,
  ErrorSipago,
} from "@/lib/sipago/cliente";

/**
 * Lo que se prueba acá es la conversación con Sipago, que es donde están las
 * trampas: un `expires_in` que no significa lo que dice la documentación, montos
 * en centavos, y un link de checkout que aparece en tres lugares distintos del
 * JSON según qué endpoint conteste.
 */

const CREDENCIALES = {
  SIPAGO_CLIENT_ID: "un-client-id",
  SIPAGO_CLIENT_SECRET: "un-secret",
};

function respuesta(cuerpo: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(cuerpo),
  } as Response;
}

const TOKEN_OK = { token_type: "Bearer", expires_in: "3600", access_token: "tok-123" };

beforeEach(() => {
  olvidarToken();
  Object.assign(process.env, CREDENCIALES);
  delete process.env.SIPAGO_ENTORNO;
  delete process.env.SIPAGO_API_URL;
  delete process.env.SIPAGO_AUTH_URL;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ─── expires_in ─────────────────────────────────────────────────────────────

describe("cuánto dura el token", () => {
  const ahora = 1_700_000_000_000; // ms

  it("trata un número chico como duración en segundos", () => {
    // Lo que promete la documentación: expires_in = "3600".
    expect(_calcularVencimiento("3600", ahora)).toBe(ahora + 3600_000 - 60_000);
  });

  it("trata un número grande como epoch absoluto", () => {
    // Lo que devuelve de verdad el auth server de staging.
    const epochSegundos = 1_787_243_794;
    expect(_calcularVencimiento(epochSegundos, ahora)).toBe(epochSegundos * 1000 - 60_000);
  });

  it("un epoch NO se interpreta como duración", () => {
    // El bug que esto evita: 1787243794 segundos son 56 años. Un token cacheado
    // ese tiempo deja de funcionar en una hora y la app nunca vuelve a pedir
    // otro, así que la pasarela queda muerta hasta que se recicle la instancia.
    const epoch = 1_787_243_794;
    const comoDuracion = ahora + epoch * 1000;
    const calculado = _calcularVencimiento(epoch, ahora);

    expect(calculado).not.toBe(comoDuracion - 60_000);
    expect(calculado).toBeLessThan(ahora + 10 * 365 * 24 * 3600_000);
  });

  it("sin dato usable cachea sólo unos minutos", () => {
    for (const basura of [undefined, null, "", "no-es-un-numero", 0, -5]) {
      const v = _calcularVencimiento(basura, ahora);
      expect(v).toBeGreaterThan(ahora);
      expect(v).toBeLessThanOrEqual(ahora + 10 * 60_000);
    }
  });
});

// ─── Ambientes ──────────────────────────────────────────────────────────────

describe("los ambientes", () => {
  it("por defecto apunta a desarrollo, no a producción", () => {
    // El default importa: equivocarse para el lado de prod significa cobrarle
    // de verdad a alguien mientras se prueba.
    expect(entornoSipago()).toBe("test");
    expect(urlApi()).toBe("https://api-cabal.preprod.geopagos.com");
    expect(urlAuth()).toBe("https://auth.stg.geopagos.io");
  });

  it("con SIPAGO_ENTORNO=prod usa los hosts productivos", () => {
    process.env.SIPAGO_ENTORNO = "prod";
    expect(urlApi()).toBe("https://api.sipago.coop");
    expect(urlAuth()).toBe("https://auth.prd.geopagos.io");
  });

  it("cualquier otro valor cae en test", () => {
    process.env.SIPAGO_ENTORNO = "produccion"; // typo verosímil
    expect(entornoSipago()).toBe("test");
  });

  it("se puede pisar el host y se le saca la barra final", () => {
    process.env.SIPAGO_API_URL = "https://otro.host/";
    expect(urlApi()).toBe("https://otro.host");
  });

  it("sin credenciales, la pasarela se declara no configurada", () => {
    delete process.env.SIPAGO_CLIENT_ID;
    expect(sipagoConfigurado()).toBe(false);
  });
});

// ─── Montos ─────────────────────────────────────────────────────────────────

describe("los montos", () => {
  it("van en centavos", () => {
    // "El campo amount es un número entero en el que los últimos dos dígitos
    // son los decimales": $50.000 se manda como 5000000.
    expect(aCentavos(50_000)).toBe(5_000_000);
    expect(aCentavos(500_000)).toBe(50_000_000);
    expect(aCentavos(200.69)).toBe(20_069);
  });

  it("la vuelta es exacta", () => {
    expect(aPesos(aCentavos(50_000))).toBe(50_000);
  });
});

// ─── Crear orden ────────────────────────────────────────────────────────────

describe("crear la intención de pago", () => {
  function ordenCreada(links: object) {
    return {
      data: {
        attributes: { uuid: "uuid-1", status: "PENDING", price: { currency: "032", amount: 5_000_000 } },
        ...links,
      },
    };
  }

  it("manda el precio en centavos y devuelve el link de checkout", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(respuesta(TOKEN_OK))
      .mockResolvedValueOnce(
        respuesta({
          data: {
            attributes: {
              uuid: "uuid-1",
              status: "PENDING",
              price: { currency: "032", amount: 5_000_000 },
              links: { checkout: "https://checkout/orders/uuid-1" },
            },
          },
        }, 201)
      );

    const orden = await crearOrden({
      items: [{ id: 1, nombre: "UIAB Conecta — Mensual", precio: 50_000 }],
      urlExito: "https://app.test/ok",
      urlFallo: "https://app.test/fallo",
      urlWebhook: "https://app.test/hook?t=x",
    });

    expect(orden.uuid).toBe("uuid-1");
    expect(orden.urlCheckout).toBe("https://checkout/orders/uuid-1");

    const [, opciones] = fetchMock.mock.calls[1];
    const enviado = JSON.parse(String(opciones?.body));
    expect(enviado.data.attributes.items[0].unitPrice.amount).toBe(5_000_000);
    expect(enviado.data.attributes.currency).toBe("032");
    expect(enviado.data.attributes.webhookUrl).toBe("https://app.test/hook?t=x");
    // Sin esto Sipago vence el link a los 10 minutos.
    expect(enviado.data.attributes.expireLimitMinutes).toBe(1440);
    expect((opciones?.headers as Record<string, string>)["Content-Type"]).toBe("application/vnd.api+json");
  });

  it("encuentra el link aunque venga en data.links como array", async () => {
    // Es la forma que devuelve GET /orders/{uuid}; la de POST es otra y la que
    // muestra el ejemplo en PHP de la documentación, una tercera.
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(respuesta(TOKEN_OK))
      .mockResolvedValueOnce(
        respuesta(
          {
            data: {
              attributes: { uuid: "uuid-2", status: "PENDING" },
              links: [{ checkout: "https://checkout/orders/uuid-2" }],
            },
          },
          201
        )
      );

    const orden = await crearOrden({ items: [{ id: 1, nombre: "x", precio: 1 }] });
    expect(orden.urlCheckout).toBe("https://checkout/orders/uuid-2");
  });

  it("no manda redirect_urls ni webhook cuando la app corre en http", async () => {
    // Sipago sólo acepta HTTPS. Mandar localhost hace que rechace la orden
    // entera, y entonces no se puede probar nada en desarrollo.
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(respuesta(TOKEN_OK))
      .mockResolvedValueOnce(
        respuesta(ordenCreada({ links: { checkout: "https://checkout/x" } }), 201)
      );

    await crearOrden({
      items: [{ id: 1, nombre: "x", precio: 1 }],
      urlExito: "http://localhost:3000/ok",
      urlFallo: "http://localhost:3000/fallo",
      urlWebhook: "http://localhost:3000/hook",
    });

    const enviado = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(enviado.data.attributes.redirect_urls).toBeUndefined();
    expect(enviado.data.attributes.webhookUrl).toBeUndefined();
  });

  it("falla si Sipago contesta una orden sin link de checkout", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(respuesta(TOKEN_OK))
      .mockResolvedValueOnce(respuesta({ data: { attributes: { uuid: "uuid-3" } } }, 201));

    await expect(crearOrden({ items: [{ id: 1, nombre: "x", precio: 1 }] })).rejects.toThrow(ErrorSipago);
  });

  it("un 401 tira el token cacheado para que el próximo intento pida otro", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(respuesta(TOKEN_OK))
      .mockResolvedValueOnce(respuesta({ error: "unauthorized" }, 401))
      .mockResolvedValueOnce(respuesta({ ...TOKEN_OK, access_token: "tok-nuevo" }))
      .mockResolvedValueOnce(
        respuesta(ordenCreada({ links: { checkout: "https://checkout/x" } }), 201)
      );

    await expect(crearOrden({ items: [{ id: 1, nombre: "x", precio: 1 }] })).rejects.toThrow(ErrorSipago);
    await crearOrden({ items: [{ id: 1, nombre: "x", precio: 1 }] });

    // 4 llamadas: token, orden(401), token de nuevo, orden. Sin `olvidarToken()`
    // serían 3 y la segunda orden volvería a fallar con el token quemado.
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(String(fetchMock.mock.calls[3][1]?.headers)).toBeDefined();
  });

  it("reusa el token mientras siga vigente", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(respuesta(TOKEN_OK))
      .mockResolvedValue(respuesta(ordenCreada({ links: { checkout: "https://checkout/x" } }), 201));

    await crearOrden({ items: [{ id: 1, nombre: "x", precio: 1 }] });
    await crearOrden({ items: [{ id: 1, nombre: "x", precio: 1 }] });

    // 3 y no 4: el segundo cobro no vuelve a autenticarse.
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

// ─── Estado de la orden ─────────────────────────────────────────────────────

describe("leer el estado de una orden", () => {
  it("da por pagada sólo si la orden y el pago coinciden", () => {
    expect(estaPagada({ estado: "SUCCESS", pago: { estado: "APPROVED" } } as never)).toBe(true);
    // Una orden SUCCESS con el pago denegado no es un cobro.
    expect(estaPagada({ estado: "SUCCESS", pago: { estado: "DENIED" } } as never)).toBe(false);
    expect(estaPagada({ estado: "SUCCESS", pago: null } as never)).toBe(false);
    expect(estaPagada({ estado: "PENDING", pago: { estado: "APPROVED" } } as never)).toBe(false);
  });

  it("reconoce los tres finales malos y no confunde PENDING con uno", () => {
    expect(estaFallida({ estado: "EXPIRED" } as never)).toBe(true);
    expect(estaFallida({ estado: "FAILED" } as never)).toBe(true);
    expect(estaFallida({ estado: "FAILED_CHECKOUT" } as never)).toBe(true);
    expect(estaFallida({ estado: "PENDING" } as never)).toBe(false);
    expect(estaFallida({ estado: "SUCCESS" } as never)).toBe(false);
  });

  it("normaliza el pago venga en snake_case o en camelCase", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(respuesta(TOKEN_OK))
      .mockResolvedValueOnce(
        respuesta({
          data: {
            attributes: {
              uuid: "uuid-9",
              status: "SUCCESS",
              price: { currency: "032", amount: 5_000_000 },
              payment: { id: 123, status: "APPROVED", authorization_code: "012345", reference_number: "62d6" },
            },
          },
        })
      );

    const orden = await consultarOrden("uuid-9");
    expect(orden.montoCentavos).toBe(5_000_000);
    expect(orden.pago).toEqual({
      id: 123,
      estado: "APPROVED",
      codigoAutorizacion: "012345",
      numeroReferencia: "62d6",
      codigoError: null,
      mensajeError: null,
    });
    expect(estaPagada(orden)).toBe(true);
  });

  it("cae al array payments cuando payment viene vacío", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(respuesta(TOKEN_OK))
      .mockResolvedValueOnce(
        respuesta({
          data: {
            attributes: {
              uuid: "uuid-10",
              status: "SUCCESS",
              payments: [{ id: 7, status: "APPROVED", authorizationCode: "999", refNumber: "ref" }],
            },
          },
        })
      );

    const orden = await consultarOrden("uuid-10");
    expect(orden.pago?.id).toBe(7);
    expect(orden.pago?.codigoAutorizacion).toBe("999");
  });
});

describe("una tarjeta rechazada", () => {
  // Caso real del 2026-08-20: pago de $1 rechazado por el emisor con código 13
  // ("error en el formato del campo importe"). La ORDEN quedó en PENDING porque
  // Sipago admite hasta 3 intentos; sólo el PAGO quedó en DENIED.
  const ordenConRechazo = {
    estado: "PENDING",
    pago: { estado: "DENIED", codigoError: "13", mensajeError: "Verificar el sistema, error en el formato del campo importe" },
  } as never;

  it("no se confunde con una orden que todavía nadie tocó", () => {
    expect(tieneIntentoRechazado(ordenConRechazo)).toBe(true);
    expect(tieneIntentoRechazado({ estado: "PENDING", pago: null } as never)).toBe(false);
  });

  it("no la marca ni como pagada ni como fallida", () => {
    // Es el punto: la orden sigue viva y el socio puede reintentar en el mismo
    // link. Decirle "se está acreditando" era mentirle.
    expect(estaPagada(ordenConRechazo)).toBe(false);
    expect(estaFallida(ordenConRechazo)).toBe(false);
  });

  it("un pago aprobado nunca cuenta como rechazo", () => {
    expect(tieneIntentoRechazado({ estado: "SUCCESS", pago: { estado: "APPROVED" } } as never)).toBe(false);
  });

  it("una orden ya vencida es fallo definitivo, no rechazo reintentable", () => {
    expect(tieneIntentoRechazado({ estado: "EXPIRED", pago: { estado: "DENIED" } } as never)).toBe(false);
  });

  it("lee el error del emisor aunque payment venga en null", async () => {
    // Los intentos rechazados NO aparecen en `payment` —que queda en null hasta
    // que haya uno aprobado— sino sólo dentro de `payments`.
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(respuesta(TOKEN_OK))
      .mockResolvedValueOnce(
        respuesta({
          data: {
            attributes: {
              uuid: "u", status: "PENDING", payment: null,
              payments: [{
                id: "17343721", status: "DENIED", authorization_code: "",
                reference_number: "aa41a5a1", isRefunded: false,
                error: { code: "13", description: null, message: "Verificar el sistema, error en el formato del campo importe" },
              }],
            },
          },
        })
      );

    const orden = await consultarOrden("u");
    expect(orden.pago?.estado).toBe("DENIED");
    expect(orden.pago?.codigoError).toBe("13");
    expect(orden.pago?.mensajeError).toMatch(/importe/);
    expect(tieneIntentoRechazado(orden)).toBe(true);
  });
});

// ─── HTTPS ──────────────────────────────────────────────────────────────────

describe("el guard de https", () => {
  it("sólo acepta https", () => {
    expect(esHttps("https://a.com")).toBe(true);
    expect(esHttps("http://a.com")).toBe(false);
    expect(esHttps(undefined)).toBe(false);
    expect(esHttps("")).toBe(false);
  });
});
