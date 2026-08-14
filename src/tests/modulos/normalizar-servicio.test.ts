import { describe, expect, it } from "vitest";
import {
  estaNormalizado,
  normalizarNombreServicio,
} from "@/modulos/compartido/especialidades";

/**
 * El catálogo de servicios mezclaba entradas curadas con lo que cada socia
 * escribió a mano: "alquiler autoelevador" al lado de "Reparación de Frenos
 * Industriales". Esto fija cómo queda un nombre cuando pasa a ser público.
 */
describe("normalizarNombreServicio", () => {
  it("capitaliza lo que vino todo en minúscula", () => {
    expect(normalizarNombreServicio("alquiler autoelevador")).toBe("Alquiler Autoelevador");
    expect(normalizarNombreServicio("resina")).toBe("Resina");
  });

  it("deja los conectores en minúscula", () => {
    expect(normalizarNombreServicio("alquiler de andamios")).toBe("Alquiler de Andamios");
    expect(normalizarNombreServicio("industria de materiales compuesto")).toBe(
      "Industria de Materiales Compuesto"
    );
  });

  it("saca el punto final que quedó de escribir una oración", () => {
    expect(
      normalizarNombreServicio("Fabricación de resinas y gelcoat para uso industrial.")
    ).toBe("Fabricación de Resinas y Gelcoat para Uso Industrial");
  });

  it("no toca las MAYÚSCULAS: es la convención de los macro-rubros", () => {
    expect(normalizarNombreServicio("METALMECÁNICA Y METALURGIA")).toBe(
      "METALMECÁNICA Y METALURGIA"
    );
    expect(normalizarNombreServicio("MANTENIMIENTO INDUSTRIAL (SERVICIOS)")).toBe(
      "MANTENIMIENTO INDUSTRIAL (SERVICIOS)"
    );
  });

  it("respeta las siglas ya escritas por quien sabe", () => {
    expect(normalizarNombreServicio("Tornería y CNC")).toBe("Tornería y CNC");
    expect(normalizarNombreServicio("Depósitos/3PL")).toBe("Depósitos/3PL");
    expect(normalizarNombreServicio("Normas ISO/Certificaciones")).toBe(
      "Normas ISO/Certificaciones"
    );
  });

  it("no se come el punto de una sigla", () => {
    expect(normalizarNombreServicio("E.P.P. (Seguridad)")).toBe("E.P.P. (Seguridad)");
  });

  it("arranca palabra después de una barra o un guion", () => {
    expect(normalizarNombreServicio("corte y plegado/rolado")).toBe("Corte y Plegado/Rolado");
  });

  it("colapsa los espacios de más y recorta", () => {
    expect(normalizarNombreServicio("  alquiler   plataforma  tijera ")).toBe(
      "Alquiler Plataforma Tijera"
    );
  });

  it("no inventa tildes: eso lo corrige el admin a mano", () => {
    expect(normalizarNombreServicio("fabricacion de resinas y cauchos sinteticos")).toBe(
      "Fabricacion de Resinas y Cauchos Sinteticos"
    );
  });

  it("es idempotente: aplicarla de nuevo no cambia nada", () => {
    const casos = [
      "alquiler de andamios",
      "METALMECÁNICA Y METALURGIA",
      "E.P.P. (Seguridad)",
      "Fabricación de resinas y gelcoat para uso industrial.",
      "Depósitos/3PL",
    ];
    for (const caso of casos) {
      const unaVez = normalizarNombreServicio(caso);
      expect(normalizarNombreServicio(unaVez)).toBe(unaVez);
    }
  });

  it("aguanta vacío y nulo sin romper", () => {
    expect(normalizarNombreServicio("")).toBe("");
    expect(normalizarNombreServicio(null)).toBe("");
    expect(normalizarNombreServicio("   ")).toBe("");
  });
});

describe("estaNormalizado", () => {
  it("distingue lo que hay que tocar de lo que ya está bien", () => {
    expect(estaNormalizado("Alquiler de Andamios")).toBe(true);
    expect(estaNormalizado("METALMECÁNICA Y METALURGIA")).toBe(true);
    expect(estaNormalizado("alquiler de andamios")).toBe(false);
    expect(estaNormalizado("")).toBe(false);
  });
});
