import { describe, it, expect } from "vitest";
import {
  proximaFechaCobroAnual,
  primerCobroAnualEstimado,
  fechaCobroAnualEnPalabras,
} from "@/lib/sipago/planes";

/**
 * El plan anual de Sipago cobra en un mes y dia FIJOS del calendario, iguales
 * para todos, y prorratea el primer cobro. Estas cuentas existen para no
 * mentirle al socio en el checkout: la pantalla dice "$500.000 / ano" y lo que
 * le van a debitar ahora es otra cosa.
 *
 * Por defecto la fecha es el 10 de enero (SIPAGO_PLAN_ANUAL_DIA / _MES).
 */

describe("cuándo cae el próximo cobro anual", () => {
  it("si la fecha todavía no pasó este año, es este año", () => {
    expect(proximaFechaCobroAnual(new Date("2026-01-05T00:00:00Z")).toISOString().slice(0, 10))
      .toBe("2026-01-10");
  });

  it("si ya pasó, es el año que viene", () => {
    expect(proximaFechaCobroAnual(new Date("2026-08-20T00:00:00Z")).toISOString().slice(0, 10))
      .toBe("2027-01-10");
  });

  it("el mismo día de cobro cuenta como pasado: no se cobra dos veces", () => {
    // Si alguien se adhiere justo el 10 de enero, su proximo cobro es el del
    // ano siguiente. Devolver la fecha de hoy haria que el prorrateo diera cero.
    expect(proximaFechaCobroAnual(new Date("2026-01-10T00:00:00Z")).toISOString().slice(0, 10))
      .toBe("2027-01-10");
  });
});

describe("cuánto sale el primer año", () => {
  it("adherirse en agosto sale bastante menos que el precio de lista", () => {
    const monto = primerCobroAnualEstimado(500_000, new Date("2026-08-20T00:00:00Z"));
    expect(monto).toBeGreaterThan(150_000);
    expect(monto).toBeLessThan(250_000);
  });

  it("adherirse justo antes de la fecha sale casi nada", () => {
    expect(primerCobroAnualEstimado(500_000, new Date("2026-01-08T00:00:00Z")))
      .toBeLessThan(10_000);
  });

  it("nunca supera el precio de lista", () => {
    // Aunque falte un ano entero, el prorrateo no puede cobrar de mas.
    for (const d of ["2026-01-11", "2026-06-15", "2026-12-31"]) {
      expect(primerCobroAnualEstimado(500_000, new Date(`${d}T00:00:00Z`)))
        .toBeLessThanOrEqual(500_000);
    }
  });

  it("nunca da cero ni negativo", () => {
    for (const d of ["2026-01-09", "2026-01-10", "2026-01-11"]) {
      expect(primerCobroAnualEstimado(500_000, new Date(`${d}T00:00:00Z`))).toBeGreaterThan(0);
    }
  });

  it("crece de forma monótona con los días que faltan", () => {
    // La conciliacion compara el cobro real contra esta cuenta, asi que tiene
    // que ser coherente: cuanto mas lejos la fecha de cobro, mas se paga.
    const enero = primerCobroAnualEstimado(500_000, new Date("2026-01-11T00:00:00Z"));
    const agosto = primerCobroAnualEstimado(500_000, new Date("2026-08-20T00:00:00Z"));
    const diciembre = primerCobroAnualEstimado(500_000, new Date("2026-12-20T00:00:00Z"));
    expect(enero).toBeGreaterThan(agosto);
    expect(agosto).toBeGreaterThan(diciembre);
  });
});

describe("cómo se le dice al socio", () => {
  it("en palabras, no en números sueltos", () => {
    expect(fechaCobroAnualEnPalabras()).toBe("10 de enero");
  });
});
