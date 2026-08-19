import { describe, expect, it } from "vitest";
import {
  hrefFichaDeCandidato,
  slugDeEmpresa,
  slugDeProveedor,
} from "@/modulos/compartido/ficha-publica";

/**
 * `/empresas/[slug]` no guarda el slug: lo recalcula y compara. El bug que
 * motiva estos casos es armar el link con un campo distinto al que usa el
 * resolver, que da 404 sin ningún error visible.
 *
 * Los nombres son socias reales del padrón, porque el error se colaba justo
 * ahí: en la razón social con "S.A." que el nombre comercial no lleva.
 */
describe("slug de la ficha de una socia", () => {
  it("usa la razón social, que es por donde busca la ruta", () => {
    expect(slugDeEmpresa("Simonetta Automatización S.A.")).toBe(
      "simonetta-automatizacion-sa"
    );
    expect(slugDeEmpresa("ORMAZABAL ARGENTINA S.A.")).toBe("ormazabal-argentina-sa");
  });

  it("sin razón social no inventa un destino", () => {
    expect(slugDeEmpresa(null)).toBeNull();
    expect(slugDeEmpresa("   ")).toBeNull();
  });
});

describe("slug de la ficha de un prestador", () => {
  it("prefiere el nombre comercial", () => {
    expect(
      slugDeProveedor({ nombre_comercial: "Vaxler Software", nombre: "Julián", apellido: "Boxler" })
    ).toBe("vaxler-software");
  });

  it("sin nombre comercial cae en nombre + apellido, no sólo en el nombre", () => {
    expect(
      slugDeProveedor({ nombre_comercial: null, nombre: "Julián", apellido: "Boxler" })
    ).toBe("julian-boxler");
  });

  it("sin ningún nombre no devuelve destino", () => {
    expect(slugDeProveedor({ nombre_comercial: null, nombre: null, apellido: null })).toBeNull();
    expect(slugDeProveedor(null)).toBeNull();
  });
});

describe("link del candidato de una oportunidad", () => {
  it("NO usa el nombre comercial de la socia aunque sea el que se muestra", () => {
    // La tarjeta rotula "Simonetta Automatización"; la ficha vive en
    // "simonetta-automatizacion-sa". Armar el link con el rótulo era el 404.
    const href = hrefFichaDeCandidato({
      empresa: { razon_social: "Simonetta Automatización S.A." },
    });
    expect(href).toBe("/empresas/simonetta-automatizacion-sa");
  });

  it("resuelve al prestador cuando la candidata no es una socia", () => {
    expect(
      hrefFichaDeCandidato({
        empresa: null,
        proveedor: { nombre_comercial: "Andamios Burzaco" },
      })
    ).toBe("/empresas/andamios-burzaco");
  });

  it("devuelve null si el join no trajo la contraparte, para no linkear al vacío", () => {
    expect(hrefFichaDeCandidato({ empresa: null, proveedor: null })).toBeNull();
  });

  it("nunca arma el link con un UUID", () => {
    const href = hrefFichaDeCandidato({
      empresa: { razon_social: "GENROD S.A." },
    });
    expect(href).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    );
  });
});
