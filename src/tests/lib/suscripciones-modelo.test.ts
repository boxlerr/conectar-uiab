import { describe, it, expect } from "vitest";
import {
  PRECIO_MENSUAL,
  PRECIO_ANUAL,
  PRECIOS_POR_DEFECTO,
  ahorroAnual,
  aporteAnual,
  aporteMensual,
  calcularMontoMensual,
  equivalenteMensual,
  mesesGratis,
  montoPorCiclo,
  nombrePlan,
  proximoCobro,
  rutaExigeSuscripcion,
  sumarUnMes,
  sumarUnAnio,
  tieneAcceso,
} from "@/lib/suscripciones/modelo";

/**
 * La regla comercial del 2026-08-14: una sola suscripción, mensual o anual, y el
 * anual es pagar 10 meses y llevarse 12. Se fija acá porque es aritmética exacta
 * y porque el copy de media plataforma ("te ahorrás 2 meses") sale de esta cuenta.
 */
describe("el precio único", () => {
  it("el anual es pagar diez meses", () => {
    expect(PRECIO_ANUAL).toBe(PRECIO_MENSUAL * 10);
  });

  it("el ahorro son exactamente 2 meses", () => {
    expect(ahorroAnual()).toBe(PRECIO_MENSUAL * 2);
    expect(mesesGratis()).toBe(2);
  });

  it("el anual llevado a mes queda por debajo del mensual", () => {
    expect(equivalenteMensual()).toBeLessThan(PRECIO_MENSUAL);
  });

  it("el ahorro se recalcula solo si cambian los precios", () => {
    const otros = { mensual: 80_000, anual: 720_000 };
    expect(mesesGratis(otros)).toBe(3);
    expect(ahorroAnual(otros)).toBe(240_000);
  });

  it("no promete ahorro donde no lo hay", () => {
    expect(mesesGratis({ mensual: 50_000, anual: 600_000 })).toBe(0);
  });
});

describe("montoPorCiclo", () => {
  it("cobra el precio del ciclo elegido", () => {
    expect(montoPorCiclo("mensual")).toBe(PRECIO_MENSUAL);
    expect(montoPorCiclo("anual")).toBe(PRECIO_ANUAL);
  });

  it("usa el precio de la base cuando se lo pasan", () => {
    expect(montoPorCiclo("anual", { mensual: 60_000, anual: 600_000 })).toBe(600_000);
  });
});

/**
 * `suscripciones.monto` guarda el monto DEL CICLO. Sumar un anual como si fuera
 * mensual multiplicaba la métrica por 10, que es parte de por qué el panel de
 * admin mostraba una facturación que no existía.
 */
describe("aporte de una suscripción", () => {
  it("un anual aporta la doceava parte por mes", () => {
    expect(aporteMensual(600_000, "anual")).toBe(50_000);
    expect(aporteAnual(600_000, "anual")).toBe(600_000);
  });

  it("un mensual se proyecta a doce meses", () => {
    expect(aporteMensual(50_000, "mensual")).toBe(50_000);
    expect(aporteAnual(50_000, "mensual")).toBe(600_000);
  });

  it("la cortesía no aporta nada", () => {
    expect(aporteMensual(0, "mensual")).toBe(0);
    expect(aporteAnual(null, null)).toBe(0);
  });

  it("sin ciclo se asume mensual, que es el default de la tabla", () => {
    expect(aporteMensual(50_000, null)).toBe(50_000);
  });
});

describe("calcularMontoMensual", () => {
  it("es plano: no mira empleados, rol ni tarifa", () => {
    expect(calcularMontoMensual()).toBe(PRECIO_MENSUAL);
    expect(calcularMontoMensual({ empleados: 5 })).toBe(PRECIO_MENSUAL);
    expect(calcularMontoMensual({ empleados: 900, role: "company", tarifa: 3 })).toBe(PRECIO_MENSUAL);
  });

  it("respeta el precio vigente si se lo pasan", () => {
    expect(calcularMontoMensual({ precios: { mensual: 75_000, anual: 750_000 } })).toBe(75_000);
  });
});

describe("nombrePlan", () => {
  it("nombra el ciclo, que es lo único que distingue un plan de otro", () => {
    expect(nombrePlan("mensual")).toBe("UIAB Conecta — Mensual");
    expect(nombrePlan("anual")).toBe("UIAB Conecta — Anual");
  });
});

/**
 * El bug que esto fija: webhook, verificar-pago y el pago manual sumaban SIEMPRE
 * un mes. Quien pagaba $500.000 por un año quedaba con el vencimiento a 30 días,
 * y el cron lo mandaba a mora al mes con mail de deuda incluido.
 */
describe("proximoCobro", () => {
  it("un anual vence recién dentro de un año", () => {
    const desde = new Date(Date.UTC(2026, 7, 14));
    expect(proximoCobro("anual", desde).getUTCFullYear()).toBe(2027);
    expect(proximoCobro("anual", desde).getUTCMonth()).toBe(7);
  });

  it("un mensual vence al mes", () => {
    const desde = new Date(Date.UTC(2026, 7, 14));
    const r = proximoCobro("mensual", desde);
    expect(r.getUTCFullYear()).toBe(2026);
    expect(r.getUTCMonth()).toBe(8);
  });

  it("el anual cae más lejos que el mensual, siempre", () => {
    const desde = new Date(Date.UTC(2026, 0, 1));
    expect(proximoCobro("anual", desde).getTime()).toBeGreaterThan(
      proximoCobro("mensual", desde).getTime()
    );
  });
});

describe("sumarUnAnio", () => {
  it("suma un año calendario", () => {
    const d = new Date(Date.UTC(2026, 1, 28));
    expect(sumarUnAnio(d).getUTCFullYear()).toBe(2027);
  });
});

describe("PRECIOS_POR_DEFECTO", () => {
  it("son la red de los precios de la base", () => {
    expect(PRECIOS_POR_DEFECTO).toEqual({ mensual: PRECIO_MENSUAL, anual: PRECIO_ANUAL });
  });
});

describe("sumarUnMes", () => {
  it("suma un mes calendario", () => {
    const d = new Date(Date.UTC(2026, 0, 15));
    const r = sumarUnMes(d);
    expect(r.getUTCMonth()).toBe(1);
    expect(r.getUTCFullYear()).toBe(2026);
  });
  it("rueda a enero del siguiente año", () => {
    const d = new Date(Date.UTC(2026, 11, 15));
    const r = sumarUnMes(d);
    expect(r.getUTCMonth()).toBe(0);
    expect(r.getUTCFullYear()).toBe(2027);
  });
});

describe("tieneAcceso", () => {
  it("activa permite acceso", () => {
    expect(tieneAcceso("activa", null)).toBe(true);
  });
  // Item 1.2 del reporte de Lucas: toda suscripción nace en pendiente_pago
  // desde register-sync. Mientras contó como acceso, quien se registraba y no
  // pasaba por el checkout usaba la plataforma completa sin abonar el canon.
  it("pendiente_pago NO permite: es un alta que todavía no abonó", () => {
    expect(tieneAcceso("pendiente_pago", null)).toBe(false);
  });
  it("en_mora permite si gracia futura", () => {
    const futuro = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
    expect(tieneAcceso("en_mora", futuro)).toBe(true);
  });
  it("en_mora no permite si gracia vencida", () => {
    const pasado = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    expect(tieneAcceso("en_mora", pasado)).toBe(false);
  });
  it("suspendida y cancelada no permiten", () => {
    expect(tieneAcceso("suspendida", null)).toBe(false);
    expect(tieneAcceso("cancelada", null)).toBe(false);
  });
  it("undefined no permite", () => {
    expect(tieneAcceso(null, null)).toBe(false);
  });
});

/**
 * El agujero del 2026-08-13: Transporte Gav se registró, no pagó, y aun así entró
 * a /perfil y le arrancó el tutorial de onboarding. El gate existía pero sólo
 * cubría /oportunidades y las fichas internas; el panel y todo /perfil — donde se
 * edita la ficha pública, se carga el catálogo, se contesta la bandeja y se dan de
 * alta usuarios — quedaban abiertos.
 */
describe("rutaExigeSuscripcion", () => {
  it("tapa el panel y todo /perfil", () => {
    for (const ruta of [
      "/panel-de-control",
      "/perfil",
      "/perfil/datos",
      "/perfil/productos-servicios",
      "/perfil/solicitudes",
      "/perfil/usuarios",
      "/perfil/certificaciones",
      "/perfil/etiquetas",
    ]) {
      expect(rutaExigeSuscripcion(ruta), `${ruta} debería exigir suscripción`).toBe(true);
    }
  });

  it("sigue tapando lo que ya tapaba", () => {
    expect(rutaExigeSuscripcion("/oportunidades")).toBe(true);
    expect(rutaExigeSuscripcion("/oportunidades/nueva")).toBe(true);
    expect(rutaExigeSuscripcion("/empresa/abc")).toBe(true);
    expect(rutaExigeSuscripcion("/proveedor/abc")).toBe(true);
  });

  it("deja pasar las rutas donde justamente se paga", () => {
    // Si éstas entraran al gate, quien no pagó quedaría encerrado sin salida.
    expect(rutaExigeSuscripcion("/suscripcion/checkout")).toBe(false);
    expect(rutaExigeSuscripcion("/suscripcion/bloqueado")).toBe(false);
    expect(rutaExigeSuscripcion("/perfil/suscripcion")).toBe(false);
  });

  it("no toca lo público, el admin ni las APIs", () => {
    for (const ruta of [
      "/",
      "/directorio",
      "/empresas",
      "/empresas/vaxler",
      "/sumate",
      "/login",
      "/register",
      "/pendiente-aprobacion",
      "/admin",
      "/admin/altas",
      "/api/auth/logout",
      "/api/suscripcion/solicitar",
    ]) {
      expect(rutaExigeSuscripcion(ruta), `${ruta} NO debería exigir suscripción`).toBe(false);
    }
  });
});
