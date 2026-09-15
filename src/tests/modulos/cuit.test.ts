import { describe, expect, it } from "vitest";
import { cuitValido, formatearCuit, soloDigitosCuit } from "@/modulos/compartido/cuit";

/**
 * CUIT reales de socias, copiados de la base de producción. Sirven de doble
 * control: si la cuenta del módulo 11 estuviera mal, estos fallarían.
 *
 * Contrastado el 2026-09-15 contra las 57 fichas aprobadas que tienen CUIT
 * cargado: las 57 pasan esta validación. O sea que el algoritmo coincide con el
 * de ARCA y, de paso, que los datos del padrón están limpios.
 */
const CUITS_REALES = [
  "33-71199319-9", // Simonetta Automatización S.A.
  "33-70979631-9", // NAVES DEL SUR SA
  "30-54891771-5", // ZOLODA S.A.
];

describe("soloDigitosCuit", () => {
  it("saca guiones, espacios y puntos", () => {
    expect(soloDigitosCuit("30-54891771-5")).toBe("30548917715");
    expect(soloDigitosCuit("30 54891771 5")).toBe("30548917715");
    expect(soloDigitosCuit("30.548917715")).toBe("30548917715");
  });

  it("corta a 11 dígitos en vez de romperse", () => {
    expect(soloDigitosCuit("305489177151234")).toBe("30548917715");
  });

  it("no inventa nada con entrada vacía o basura", () => {
    expect(soloDigitosCuit("")).toBe("");
    expect(soloDigitosCuit("no soy un cuit")).toBe("");
  });
});

describe("formatearCuit", () => {
  it("escribe el CUIT como aparece en una factura", () => {
    expect(formatearCuit("30548917715")).toBe("30-54891771-5");
  });

  it("va formateando mientras se tipea, sin adelantarse", () => {
    expect(formatearCuit("3")).toBe("3");
    expect(formatearCuit("30")).toBe("30");
    expect(formatearCuit("305")).toBe("30-5");
    expect(formatearCuit("3054891771")).toBe("30-54891771");
  });

  it("es idempotente: reformatear algo ya formateado no lo rompe", () => {
    expect(formatearCuit(formatearCuit("30548917715"))).toBe("30-54891771-5");
  });
});

describe("cuitValido", () => {
  it("acepta los CUIT reales del padrón, escritos de cualquier forma", () => {
    for (const cuit of CUITS_REALES) {
      expect(cuitValido(cuit), `${cuit} con guiones`).toBe(true);
      expect(cuitValido(soloDigitosCuit(cuit)), `${cuit} sin guiones`).toBe(true);
    }
  });

  it("rechaza un dígito verificador equivocado", () => {
    // El CUIT real de ZOLODA con el último dígito cambiado: es el error de
    // tipeo que antes entraba a la ficha publicada y rompía la conciliación de
    // Sipago (la empresa paga y el pago no se le imputa a nadie).
    expect(cuitValido("30-54891771-4")).toBe(false);
  });

  it("rechaza un prefijo que no existe", () => {
    expect(cuitValido("99-54891771-5")).toBe(false);
  });

  it("rechaza longitudes que no son 11", () => {
    expect(cuitValido("3054891771")).toBe(false);
    expect(cuitValido("")).toBe(false);
  });

  it("rechaza los repetidos, que pasarían cualquier chequeo de longitud", () => {
    expect(cuitValido("00000000000")).toBe(false);
    expect(cuitValido("11111111111")).toBe(false);
  });
});
