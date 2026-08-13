import { describe, it, expect } from "vitest";
import {
  calcularTarifaPorEmpleados,
  calcularMontoMensual,
  nombrePlan,
  sumarUnMes,
  tieneAcceso,
  rutaExigeSuscripcion,
  TARIFA_PRECIO_MENSUAL_FALLBACK,
  PRECIO_PARTICULAR_MENSUAL,
  PRECIO_MENSUAL,
} from "@/lib/mercadopago/suscripciones";

describe("calcularTarifaPorEmpleados", () => {
  it("mapea 0-30 a nivel 1", () => {
    expect(calcularTarifaPorEmpleados(0)).toBe(1);
    expect(calcularTarifaPorEmpleados(1)).toBe(1);
    expect(calcularTarifaPorEmpleados(30)).toBe(1);
  });
  it("mapea 31-99 a nivel 2", () => {
    expect(calcularTarifaPorEmpleados(31)).toBe(2);
    expect(calcularTarifaPorEmpleados(99)).toBe(2);
  });
  it("mapea 100+ a nivel 3", () => {
    expect(calcularTarifaPorEmpleados(100)).toBe(3);
    expect(calcularTarifaPorEmpleados(5000)).toBe(3);
  });
  it("trata null/undefined como 0 (nivel 1)", () => {
    expect(calcularTarifaPorEmpleados(null)).toBe(1);
    expect(calcularTarifaPorEmpleados(undefined)).toBe(1);
  });
});

describe("calcularMontoMensual", () => {
  it("usa tarifa explícita para empresa", () => {
    expect(calcularMontoMensual({ role: "company", tarifa: 2 })).toBe(
      TARIFA_PRECIO_MENSUAL_FALLBACK[2]
    );
  });
  it("deriva la tarifa desde empleados si no viene explícita", () => {
    expect(calcularMontoMensual({ role: "company", empleados: 150 })).toBe(
      TARIFA_PRECIO_MENSUAL_FALLBACK[3]
    );
  });
  // Con el plan único la función ignora los args a propósito (la firma se
  // conserva sólo para no romper las llamadas existentes). Los precios de
  // `tarifas_precios` ya no mandan: el monto es siempre PRECIO_MENSUAL. Este
  // test esperaba el precio de la DB y venía fallando desde el pase a plan único.
  it("ignora los precios de la DB: el plan es uno solo", () => {
    expect(
      calcularMontoMensual({
        role: "company",
        tarifa: 1,
        preciosDb: { 1: 200_000, 2: 400_000, 3: 600_000 },
      })
    ).toBe(PRECIO_MENSUAL);
  });
  it("devuelve precio fijo para particulares", () => {
    expect(calcularMontoMensual({ role: "provider" })).toBe(PRECIO_PARTICULAR_MENSUAL);
  });
});

// Plan único desde la reunión de julio 2026: el nombre ya no depende del rol ni
// del nivel de tarifa (antes había "— Tarifa 2", "— Empresa", "— Particular").
// Sólo distingue el ciclo. Estos tests esperaban los nombres viejos y venían
// fallando desde entonces.
describe("nombrePlan", () => {
  it("es el mismo plan para empresa y particular", () => {
    expect(nombrePlan("company")).toBe("UIAB Conecta");
    expect(nombrePlan("provider")).toBe("UIAB Conecta");
  });
  it("ignora el nivel de tarifa, que ya no existe", () => {
    expect(nombrePlan("company", 2)).toBe("UIAB Conecta");
  });
  it("distingue el ciclo anual", () => {
    expect(nombrePlan("company", null, "anual")).toBe("UIAB Conecta — Anual");
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
      "/api/mercadopago/webhook",
    ]) {
      expect(rutaExigeSuscripcion(ruta), `${ruta} NO debería exigir suscripción`).toBe(false);
    }
  });
});
