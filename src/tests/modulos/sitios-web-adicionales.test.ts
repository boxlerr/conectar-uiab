import { describe, it, expect } from "vitest";
import {
  normalizarSitiosWeb,
  MAX_SITIOS_WEB_ADICIONALES,
} from "@/lib/utilidades";

/**
 * Los sitios web extra de una ficha (algunas socias tienen la institucional y
 * la tienda). Lo que se prueba acá es la limpieza previa al guardado: es la
 * única barrera antes del CHECK de la tabla, y si algo se le escapa el guardado
 * rebota como error de base y el socio no entiende por qué.
 */
describe("normalizarSitiosWeb", () => {
  it("devuelve null cuando no hay nada que guardar", () => {
    expect(normalizarSitiosWeb(null)).toBeNull();
    expect(normalizarSitiosWeb(undefined)).toBeNull();
    expect(normalizarSitiosWeb([])).toBeNull();
    // El formulario deja inputs vacíos si el socio agrega una fila y no la usa.
    expect(normalizarSitiosWeb(["", "   ", null, undefined])).toBeNull();
  });

  it("le pone el esquema a lo que se escribió a mano", () => {
    expect(normalizarSitiosWeb(["www.tienda.com.ar"])).toEqual([
      "https://www.tienda.com.ar",
    ]);
    // No pisa un http:// viejo que la socia haya cargado a propósito.
    expect(normalizarSitiosWeb(["http://vieja.com.ar"])).toEqual([
      "http://vieja.com.ar",
    ]);
  });

  it("no repite la web principal aunque se pegue de nuevo abajo", () => {
    // El caso real: la socia copia su URL, la pega arriba y también abajo. Sin
    // esto la ficha mostraría el mismo link dos veces y el `sameAs` del JSON-LD
    // le declararía a Google un duplicado.
    expect(normalizarSitiosWeb(["www.miempresa.com"], "https://www.miempresa.com")).toBeNull();
    // Y tampoco si difieren sólo en el esquema, la barra final o las mayúsculas.
    expect(normalizarSitiosWeb(["https://WWW.MiEmpresa.com/"], "www.miempresa.com")).toBeNull();
  });

  it("deduplica entre las adicionales", () => {
    expect(
      normalizarSitiosWeb(["www.tienda.com", "https://www.tienda.com/", "www.otra.com"])
    ).toEqual(["https://www.tienda.com", "https://www.otra.com"]);
  });

  it("conserva el orden en que las cargó el socio", () => {
    expect(normalizarSitiosWeb(["b.com", "a.com", "c.com"])).toEqual([
      "https://b.com",
      "https://a.com",
      "https://c.com",
    ]);
  });

  it("corta en el tope en vez de dejar que reviente el CHECK de la tabla", () => {
    const demasiadas = Array.from({ length: MAX_SITIOS_WEB_ADICIONALES + 3 }, (_, i) => `web${i}.com`);
    const resultado = normalizarSitiosWeb(demasiadas);
    expect(resultado).toHaveLength(MAX_SITIOS_WEB_ADICIONALES);
    expect(resultado![0]).toBe("https://web0.com");
  });

  it("nunca devuelve vacíos ni nulls adentro del array", () => {
    // Es exactamente lo que prohíbe el CHECK de empresas/proveedores.
    const resultado = normalizarSitiosWeb(["", "www.a.com", null, "   ", "www.b.com"]);
    expect(resultado).toEqual(["https://www.a.com", "https://www.b.com"]);
    expect(resultado!.every((w) => typeof w === "string" && w.trim() !== "")).toBe(true);
  });
});
