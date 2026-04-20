import { describe, it, expect } from "vitest";
import {
  calcularTarifaPorEmpleados,
  calcularMontoMensual,
  nombrePlan,
  sumarUnMes,
  tieneAcceso,
  TARIFA_PRECIO_MENSUAL_FALLBACK,
  PRECIO_PARTICULAR_MENSUAL,
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
  it("usa precio de DB cuando está disponible", () => {
    expect(
      calcularMontoMensual({
        role: "company",
        tarifa: 1,
        preciosDb: { 1: 200_000, 2: 400_000, 3: 600_000 },
      })
    ).toBe(200_000);
  });
  it("devuelve precio fijo para particulares", () => {
    expect(calcularMontoMensual({ role: "provider" })).toBe(PRECIO_PARTICULAR_MENSUAL);
  });
});

describe("nombrePlan", () => {
  it("incluye el nivel en empresas", () => {
    expect(nombrePlan("company", 2)).toBe("UIAB Conecta — Tarifa 2");
  });
  it("fallback sin tarifa para empresa", () => {
    expect(nombrePlan("company")).toBe("UIAB Conecta — Empresa");
  });
  it("particular fijo", () => {
    expect(nombrePlan("provider")).toBe("UIAB Conecta — Particular");
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
  it("activa y pendiente_pago permiten acceso", () => {
    expect(tieneAcceso("activa", null)).toBe(true);
    expect(tieneAcceso("pendiente_pago", null)).toBe(true);
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
