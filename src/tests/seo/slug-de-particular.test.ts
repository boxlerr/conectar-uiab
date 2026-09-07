import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { crearSlug, nombreDeFichaParticular } from "@/lib/utilidades";

const RAIZ = process.cwd();
const leer = (...t: string[]) => readFileSync(join(RAIZ, ...t), "utf8");

/** Igual que en entidad-y-rubros.test.ts: los comentarios explican los bugs
 *  arreglados, así que un assert sobre el archivo crudo se dispara contra su
 *  propia documentación. Estos asserts miran el CÓDIGO. */
const leerCodigo = (...t: string[]) =>
  leer(...t)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

/**
 * EL BUG QUE FIJA ESTE ARCHIVO
 *
 * El slug de un particular se calculaba a mano en cinco lugares, con cuatro
 * resultados distintos. El peor era `sitemap.ts`, que publicaba
 * `crearSlug(razon_social)` mientras `/empresas/[slug]` resuelve por
 * `nombre_comercial` o `nombre + apellido`: la primera alta cuya razón social
 * no coincidiera con su nombre comercial habría entrado al sitemap como una URL
 * que da 404 — y encima con `priority: 0.8`.
 *
 * No se detectó antes porque la tabla `proveedores` está vacía: es un bug que
 * aparece recién con la primera alta y que nadie relaciona con el sitemap.
 *
 * El invariante que importa: **el slug que se publica y el slug que se resuelve
 * salen de la misma función**. Si alguien vuelve a escribirlo a mano, esto falla.
 */
describe("el slug de un particular sale de una sola regla", () => {
  const CASOS = [
    {
      que: "nombre_comercial gana sobre nombre y apellido",
      fila: { nombre_comercial: "Estudio Pérez", nombre: "Ana", apellido: "Pérez" },
      espera: "estudio-perez",
    },
    {
      que: "sin nombre_comercial cae a nombre + apellido",
      fila: { nombre_comercial: null, nombre: "Ana", apellido: "Pérez" },
      espera: "ana-perez",
    },
    {
      que: "sólo nombre, sin apellido",
      fila: { nombre_comercial: null, nombre: "Ana", apellido: null },
      espera: "ana",
    },
  ];

  for (const c of CASOS) {
    it(c.que, () => {
      expect(crearSlug(nombreDeFichaParticular(c.fila))).toBe(c.espera);
    });
  }

  it("una fila sin ningún nombre devuelve cadena vacía, no 'Sin nombre'", () => {
    // `sin-nombre` sería una URL real e indexable para una ficha sin identidad.
    const vacia = { nombre_comercial: null, nombre: null, apellido: null };
    expect(nombreDeFichaParticular(vacia)).toBe("");
    expect(crearSlug(nombreDeFichaParticular(vacia))).not.toBe("sin-nombre");
  });

  it("`razon_social` NO participa del slug de un particular", () => {
    // El campo existe en la tabla y era justamente el que usaba el sitemap.
    const fila = {
      nombre_comercial: "Estudio Pérez",
      nombre: "Ana",
      apellido: "Pérez",
    };
    expect(nombreDeFichaParticular({ ...fila, razon_social: "Otra Cosa S.R.L." } as never))
      .toBe("Estudio Pérez");
  });

  it("el sitemap no vuelve a publicar el slug de la razón social", () => {
    const fuente = leerCodigo("src", "app", "sitemap.ts");
    const bloque = fuente.slice(
      fuente.indexOf("proveedorRoutes"),
      fuente.indexOf("const oportunidadRoutes")
    );
    expect(bloque).toContain("nombreDeFichaParticular");
    expect(bloque).not.toContain("razon_social");
  });

  it("nadie vuelve a escribir la regla a mano", () => {
    // El patrón exacto que estaba duplicado en cinco lugares.
    const aMano = /nombre_comercial\s*\|\|/;
    for (const archivo of [
      ["src", "app", "sitemap.ts"],
      ["src", "app", "empresas", "[slug]", "page.tsx"],
      ["src", "app", "e", "[id]", "route.ts"],
    ]) {
      expect(leerCodigo(...archivo), archivo.join("/")).not.toMatch(aMano);
    }
  });

  it("la ficha y /e/{id} resuelven por la misma función", () => {
    for (const archivo of [
      ["src", "app", "empresas", "[slug]", "page.tsx"],
      ["src", "app", "e", "[id]", "route.ts"],
    ]) {
      expect(leerCodigo(...archivo), archivo.join("/")).toContain(
        "nombreDeFichaParticular"
      );
    }
  });
});
