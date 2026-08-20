import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Acreditar un pago es la operación con consecuencias de toda la integración:
 * es la que le abre la plataforma a alguien y la que mueve la fecha del próximo
 * cobro. Lo que se prueba acá es que no se pase de la raya en ninguna dirección
 * — que no active de más (montos que no cierran, duplicados) ni de menos (un
 * rechazo no puede tumbar una suscripción que ya estaba paga).
 */

const consultarOrden = vi.fn();
const enviarEmail = vi.fn().mockResolvedValue({ ok: true });
const notificarEntidad = vi.fn().mockResolvedValue(undefined);

let db: ReturnType<typeof crearDb>;

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => db.cliente }));
vi.mock("@/lib/email/cliente", () => ({
  enviarEmail: (...a: unknown[]) => enviarEmail(...a),
  emailAdmin: () => "admin@uiab.com.ar",
  appUrl: () => "https://app.test",
}));
vi.mock("@/modulos/notificaciones/acciones", () => ({
  notificarEntidad: (...a: unknown[]) => notificarEntidad(...a),
}));
vi.mock("@/lib/sipago/cliente", async (original) => ({
  ...(await original<typeof import("@/lib/sipago/cliente")>()),
  consultarOrden: (...a: unknown[]) => consultarOrden(...a),
}));

const { acreditarOrden, desdeCuandoCorre } = await import("@/lib/sipago/acreditacion");

// ─── Doble de la base ───────────────────────────────────────────────────────

function crearDb(filas: Record<string, unknown>, opciones: { errorInsert?: { code?: string; message: string } } = {}) {
  const inserts: Array<{ tabla: string; fila: Record<string, unknown> }> = [];
  const updates: Array<{ tabla: string; cambios: Record<string, unknown> }> = [];

  function from(tabla: string) {
    const q: Record<string, unknown> = {};
    Object.assign(q, {
      select: () => q,
      eq: () => q,
      match: () => q,
      order: () => q,
      limit: () => q,
      maybeSingle: async () => ({ data: filas[tabla] ?? null, error: null }),
      insert: async (fila: Record<string, unknown>) => {
        if (tabla === "pagos_suscripciones" && opciones.errorInsert) {
          return { error: opciones.errorInsert };
        }
        inserts.push({ tabla, fila });
        return { error: null };
      },
      update: (cambios: Record<string, unknown>) => ({
        eq: async () => {
          updates.push({ tabla, cambios });
          return { error: null };
        },
      }),
    });
    return q;
  }

  return { cliente: { from } as never, inserts, updates };
}

const SUSCRIPCION = {
  id: "sus-1",
  empresa_id: "emp-1",
  proveedor_id: null,
  monto: 50_000,
  ciclo: "mensual",
  nombre_plan: "UIAB Conecta — Mensual",
  estado: "pendiente_pago",
};

const EMPRESA = { email: "socio@empresa.com", razon_social: "Metalúrgica del Sur SA" };

function ordenPaga(extra: Record<string, unknown> = {}) {
  return {
    uuid: "orden-1",
    estado: "SUCCESS",
    montoCentavos: 5_000_000,
    numeroOrden: "0000169-0000384610",
    urlCheckout: "https://checkout/orden-1",
    pago: { id: 1823, estado: "APPROVED", codigoAutorizacion: "901159", numeroReferencia: "62b4a8ff" },
    crudo: {},
    ...extra,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Pago aprobado ──────────────────────────────────────────────────────────

describe("un pago aprobado", () => {
  it("registra el pago y deja la suscripción activa", async () => {
    db = crearDb({ suscripciones: SUSCRIPCION, pagos_suscripciones: null, empresas: EMPRESA });
    consultarOrden.mockResolvedValue(ordenPaga());

    const r = await acreditarOrden("orden-1");

    expect(r).toEqual({ estado: "acreditado", suscripcionId: "sus-1", yaEstaba: false });

    const pago = db.inserts.find((i) => i.tabla === "pagos_suscripciones")!.fila;
    expect(pago.estado).toBe("aprobado");
    expect(pago.metodo_pago).toBe("sipago");
    expect(pago.tipo_pago).toBe("automatico");
    expect(pago.monto).toBe(50_000); // en pesos, no en centavos
    expect(pago.sipago_order_uuid).toBe("orden-1");
    expect(pago.sipago_payment_id).toBe("1823");

    const cambios = db.updates.find((u) => u.tabla === "suscripciones")!.cambios;
    expect(cambios.estado).toBe("activa");
    expect(cambios.metodo_pago).toBe("sipago");
    expect(cambios.gracia_hasta).toBeNull();
  });

  it("empuja el próximo cobro un mes, o un año si el plan es anual", async () => {
    for (const [ciclo, mesesEsperados] of [["mensual", 1], ["anual", 12]] as const) {
      db = crearDb({ suscripciones: { ...SUSCRIPCION, ciclo }, pagos_suscripciones: null, empresas: EMPRESA });
      consultarOrden.mockResolvedValue(
        ordenPaga({ montoCentavos: ciclo === "anual" ? 5_000_000 : 5_000_000 })
      );

      await acreditarOrden("orden-1");

      const cambios = db.updates.find((u) => u.tabla === "suscripciones")!.cambios;
      const proximo = new Date(String(cambios.proximo_cobro_en));
      const meses =
        (proximo.getUTCFullYear() - new Date().getUTCFullYear()) * 12 +
        (proximo.getUTCMonth() - new Date().getUTCMonth());
      expect(meses).toBe(mesesEsperados);
    }
  });

  it("avisa al socio y al admin, y deja la notificación in-web", async () => {
    db = crearDb({ suscripciones: SUSCRIPCION, pagos_suscripciones: null, empresas: EMPRESA });
    consultarOrden.mockResolvedValue(ordenPaga());

    await acreditarOrden("orden-1");

    const destinatarios = enviarEmail.mock.calls.map((c) => (c[0] as { para: string }).para);
    expect(destinatarios).toContain("socio@empresa.com");
    expect(destinatarios).toContain("admin@uiab.com.ar");
    expect(notificarEntidad).toHaveBeenCalledWith(expect.objectContaining({ tipo: "pago_confirmado" }));
  });
});

describe("renovar antes de tiempo", () => {
  it("suma el ciclo nuevo a lo que le quedaba, no lo pisa", async () => {
    // El socio al día que renueva una semana antes no puede perder esa semana
    // por haberse adelantado.
    const enUnaSemana = new Date(Date.now() + 7 * 24 * 3600_000);
    db = crearDb({
      suscripciones: { ...SUSCRIPCION, estado: "activa", proximo_cobro_en: enUnaSemana.toISOString() },
      pagos_suscripciones: null,
      empresas: EMPRESA,
    });
    consultarOrden.mockResolvedValue(ordenPaga());

    await acreditarOrden("orden-1");

    const cambios = db.updates.find((u) => u.tabla === "suscripciones")!.cambios;
    const proximo = new Date(String(cambios.proximo_cobro_en));
    const esperado = new Date(enUnaSemana);
    esperado.setUTCMonth(esperado.getUTCMonth() + 1);
    expect(proximo.toISOString()).toBe(esperado.toISOString());
  });

  it("al que está vencido le cuenta desde hoy", async () => {
    const haceUnMes = new Date(Date.now() - 30 * 24 * 3600_000);
    db = crearDb({
      suscripciones: { ...SUSCRIPCION, estado: "en_mora", proximo_cobro_en: haceUnMes.toISOString() },
      pagos_suscripciones: null,
      empresas: EMPRESA,
    });
    consultarOrden.mockResolvedValue(ordenPaga());

    await acreditarOrden("orden-1");

    const cambios = db.updates.find((u) => u.tabla === "suscripciones")!.cambios;
    // No arrastra la deuda: el ciclo nuevo no puede vencer en el pasado.
    expect(new Date(String(cambios.proximo_cobro_en)).getTime()).toBeGreaterThan(Date.now());
  });

  it("desdeCuandoCorre resuelve los bordes", () => {
    const ahora = new Date("2026-08-20T12:00:00.000Z");
    const futuro = "2026-09-15T00:00:00.000Z";
    const pasado = "2026-07-15T00:00:00.000Z";

    expect(desdeCuandoCorre(futuro, ahora).toISOString()).toBe(futuro);
    expect(desdeCuandoCorre(pasado, ahora)).toBe(ahora);
    expect(desdeCuandoCorre(null, ahora)).toBe(ahora);
    expect(desdeCuandoCorre(undefined, ahora)).toBe(ahora);
    // Una fecha rota en la base no puede hacer que el próximo cobro sea NaN.
    expect(desdeCuandoCorre("no-es-una-fecha", ahora)).toBe(ahora);
  });
});

// ─── Idempotencia ───────────────────────────────────────────────────────────

describe("el mismo pago avisado dos veces", () => {
  it("no se carga de nuevo si ya está en la base", async () => {
    // Sipago reintenta el webhook 4 veces y la página de resultado consulta por
    // su cuenta. Sin este corte, cada reintento sumaba un mes de vigencia.
    db = crearDb({ suscripciones: SUSCRIPCION, pagos_suscripciones: { id: "pago-previo" }, empresas: EMPRESA });
    consultarOrden.mockResolvedValue(ordenPaga());

    const r = await acreditarOrden("orden-1");

    expect(r).toEqual({ estado: "acreditado", suscripcionId: "sus-1", yaEstaba: true });
    expect(db.inserts).toHaveLength(0);
    expect(db.updates).toHaveLength(0);
    expect(enviarEmail).not.toHaveBeenCalled();
  });

  it("tolera que el índice único gane la carrera", async () => {
    // El chequeo previo no alcanza: entre el SELECT y el INSERT hay una ventana,
    // y es justo donde caen el webhook y la vuelta del socio al mismo tiempo.
    db = crearDb(
      { suscripciones: SUSCRIPCION, pagos_suscripciones: null, empresas: EMPRESA },
      { errorInsert: { code: "23505", message: "duplicate key" } }
    );
    consultarOrden.mockResolvedValue(ordenPaga());

    const r = await acreditarOrden("orden-1");

    expect(r).toEqual({ estado: "acreditado", suscripcionId: "sus-1", yaEstaba: true });
    // Y no se manda un segundo mail de "pago confirmado" por el duplicado.
    expect(enviarEmail).not.toHaveBeenCalled();
  });

  it("un error de base que NO es duplicado se propaga", async () => {
    // Tiene que llegar hasta el webhook para que devuelva 500 y Sipago reintente.
    db = crearDb(
      { suscripciones: SUSCRIPCION, pagos_suscripciones: null, empresas: EMPRESA },
      { errorInsert: { code: "57014", message: "statement timeout" } }
    );
    consultarOrden.mockResolvedValue(ordenPaga());

    await expect(acreditarOrden("orden-1")).rejects.toThrow(/statement timeout/);
  });
});

// ─── Monto ──────────────────────────────────────────────────────────────────

describe("cuando el monto no cierra", () => {
  it("no activa nada y avisa al admin", async () => {
    // Sipago no deja adjuntar una referencia propia a la orden, así que mirar el
    // importe es la única forma de notar que se pagó otra cosa.
    db = crearDb({ suscripciones: SUSCRIPCION, pagos_suscripciones: null, empresas: EMPRESA });
    consultarOrden.mockResolvedValue(ordenPaga({ montoCentavos: 100 })); // $1

    const r = await acreditarOrden("orden-1");

    expect(r).toEqual({ estado: "monto_no_coincide", esperado: 50_000, recibido: 1 });
    expect(db.inserts).toHaveLength(0);
    expect(db.updates).toHaveLength(0);
    expect(enviarEmail).toHaveBeenCalledWith(expect.objectContaining({ para: "admin@uiab.com.ar" }));
  });

  it("acepta el pago cuando coincide exacto", async () => {
    db = crearDb({ suscripciones: { ...SUSCRIPCION, monto: "50000" }, pagos_suscripciones: null, empresas: EMPRESA });
    consultarOrden.mockResolvedValue(ordenPaga({ montoCentavos: 5_000_000 }));

    const r = await acreditarOrden("orden-1");
    expect(r.estado).toBe("acreditado");
  });
});

// ─── Otros finales ──────────────────────────────────────────────────────────

describe("órdenes que no terminaron en un cobro", () => {
  it("una orden pendiente no toca nada", async () => {
    db = crearDb({ suscripciones: SUSCRIPCION, pagos_suscripciones: null, empresas: EMPRESA });
    consultarOrden.mockResolvedValue({ ...ordenPaga(), estado: "PENDING", pago: null });

    expect(await acreditarOrden("orden-1")).toEqual({ estado: "pendiente" });
    expect(db.inserts).toHaveLength(0);
    expect(db.updates).toHaveLength(0);
  });

  it("un rechazo se registra pero NO desactiva la suscripción", async () => {
    // Quien está al día y le rebota un pago sigue adentro: de moverlo a mora se
    // ocupa el cron, que es el que tiene el período de gracia.
    db = crearDb({ suscripciones: { ...SUSCRIPCION, estado: "activa" }, pagos_suscripciones: null, empresas: EMPRESA });
    consultarOrden.mockResolvedValue({ ...ordenPaga(), estado: "FAILED_CHECKOUT", pago: { id: 9, estado: "DENIED" } });

    const r = await acreditarOrden("orden-1");

    expect(r.estado).toBe("fallido");
    expect(db.inserts.find((i) => i.tabla === "pagos_suscripciones")!.fila.estado).toBe("rechazado");
    expect(db.updates).toHaveLength(0);
    expect(notificarEntidad).toHaveBeenCalledWith(expect.objectContaining({ tipo: "pago_fallido" }));
  });

  it("un link vencido también se registra", async () => {
    db = crearDb({ suscripciones: SUSCRIPCION, pagos_suscripciones: null, empresas: EMPRESA });
    consultarOrden.mockResolvedValue({ ...ordenPaga(), estado: "EXPIRED", pago: null });

    const r = await acreditarOrden("orden-1");
    expect(r).toMatchObject({ estado: "fallido" });
    expect(String((r as { motivo: string }).motivo)).toMatch(/venció/);
  });
});

describe("una tarjeta rechazada con el link todavía vivo", () => {
  const ordenRechazada = {
    uuid: "orden-1", estado: "PENDING", montoCentavos: 100, numeroOrden: "0055119-0028900133",
    urlCheckout: "https://checkout/orden-1", crudo: {},
    pago: { id: "17343721", estado: "DENIED", codigoAutorizacion: "", numeroReferencia: "aa41a5a1",
            codigoError: "13", mensajeError: "Verificar el sistema, error en el formato del campo importe" },
  };

  it("avisa que se puede reintentar y traduce el código del emisor", async () => {
    db = crearDb({ suscripciones: SUSCRIPCION, pagos_suscripciones: null, empresas: EMPRESA });
    consultarOrden.mockResolvedValue(ordenRechazada);

    const r = await acreditarOrden("orden-1");

    expect(r).toEqual({
      estado: "rechazado",
      motivo: "El importe no fue aceptado por el emisor de la tarjeta.",
      puedeReintentar: true,
    });
  });

  it("no toca la suscripción, no registra el intento y no manda mails", async () => {
    // El socio está mirando la pantalla y puede volver a probar en el momento.
    // Un mail de "no pudimos procesar tu pago" por cada tarjeta que rebota es
    // ruido, y anotar el intento ensucia el historial de pagos con ceros.
    db = crearDb({ suscripciones: { ...SUSCRIPCION, estado: "activa" }, pagos_suscripciones: null, empresas: EMPRESA });
    consultarOrden.mockResolvedValue(ordenRechazada);

    await acreditarOrden("orden-1");

    expect(db.inserts).toHaveLength(0);
    expect(db.updates).toHaveLength(0);
    expect(enviarEmail).not.toHaveBeenCalled();
    expect(notificarEntidad).not.toHaveBeenCalled();
  });

  it("un código que no conocemos muestra el texto del emisor", async () => {
    db = crearDb({ suscripciones: SUSCRIPCION, pagos_suscripciones: null, empresas: EMPRESA });
    consultarOrden.mockResolvedValue({
      ...ordenRechazada,
      pago: { ...ordenRechazada.pago, codigoError: "999", mensajeError: "Algo raro pasó" },
    });

    const r = await acreditarOrden("orden-1");
    expect(r).toMatchObject({ estado: "rechazado", motivo: "Algo raro pasó" });
  });

  it("sin código ni mensaje igual dice algo útil", async () => {
    db = crearDb({ suscripciones: SUSCRIPCION, pagos_suscripciones: null, empresas: EMPRESA });
    consultarOrden.mockResolvedValue({
      ...ordenRechazada,
      pago: { ...ordenRechazada.pago, codigoError: null, mensajeError: null },
    });

    const r = await acreditarOrden("orden-1");
    expect(r).toMatchObject({ estado: "rechazado", motivo: "El emisor de la tarjeta rechazó el pago." });
  });
});

// ─── Órdenes ajenas ─────────────────────────────────────────────────────────

describe("una orden que no es nuestra", () => {
  it("se descarta sin siquiera preguntarle a Sipago", async () => {
    // El webhook está abierto a internet y sin firma. Si un uuid desconocido
    // disparara una consulta, cualquiera podría usar el endpoint para hacernos
    // llamar a Sipago a voluntad. Primero se mira la base.
    db = crearDb({ suscripciones: null });

    expect(await acreditarOrden("orden-ajena")).toEqual({ estado: "sin_suscripcion" });
    expect(consultarOrden).not.toHaveBeenCalled();
  });
});
