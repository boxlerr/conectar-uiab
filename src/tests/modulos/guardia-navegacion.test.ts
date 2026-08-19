import { describe, expect, it } from "vitest";
import {
  destinoARescatar,
  type ClickDeNavegacion,
} from "@/components/plantillas/guardia-navegacion";

/**
 * El guard navega a mano cuando el router de Next no contesta. El riesgo no es
 * que se active de más y recargue: es que se active sobre un click que NUNCA
 * fue una navegación (abrir en otra pestaña, un `mailto:`, una descarga) y se
 * lleve al usuario de la página sin que lo haya pedido.
 *
 * Estos casos son ese borde.
 */

const CLICK_BASE: ClickDeNavegacion = {
  boton: 0,
  conModificador: false,
  cancelado: true,
  href: "https://www.uiabconecta.com/empresas/plaquimet-sa",
  target: null,
  descarga: false,
  urlActual: "https://www.uiabconecta.com/directorio",
};

const click = (cambios: Partial<ClickDeNavegacion> = {}): ClickDeNavegacion => ({
  ...CLICK_BASE,
  ...cambios,
});

describe("destinoARescatar", () => {
  it("vigila una navegación interna que el router se adjudicó", () => {
    expect(destinoARescatar(click())).toBe(
      "https://www.uiabconecta.com/empresas/plaquimet-sa"
    );
  });

  it("ignora el click que nadie canceló: ahí navega el browser solo", () => {
    // Es el caso en el que React murió y el <Link> quedó como un <a> pelado.
    // Funciona sin ayuda, y rescatarlo sería navegar dos veces.
    expect(destinoARescatar(click({ cancelado: false }))).toBeNull();
  });

  it("ignora ctrl/cmd/shift/alt: eso abre otra pestaña, no navega acá", () => {
    expect(destinoARescatar(click({ conModificador: true }))).toBeNull();
  });

  it("ignora el click que no es con el botón principal", () => {
    expect(destinoARescatar(click({ boton: 1 }))).toBeNull();
  });

  it("ignora target=_blank", () => {
    expect(destinoARescatar(click({ target: "_blank" }))).toBeNull();
  });

  it("ignora las descargas", () => {
    expect(destinoARescatar(click({ descarga: true }))).toBeNull();
  });

  it("ignora mailto: y tel:, que no son navegaciones de página", () => {
    expect(destinoARescatar(click({ href: "mailto:info@tgipack.com.ar" }))).toBeNull();
    expect(destinoARescatar(click({ href: "tel:+541141796708" }))).toBeNull();
  });

  it("ignora los links a otro dominio", () => {
    expect(destinoARescatar(click({ href: "https://uiab.org/" }))).toBeNull();
  });

  it("ignora el click que no cayó sobre un ancla", () => {
    expect(destinoARescatar(click({ href: null }))).toBeNull();
  });

  it("ignora el ancla que apunta al mismo lugar, incluido href='#'", () => {
    // Sin cambio de URL el guard se quedaría sin señal para decidir, así que
    // recargaría siempre. Y `href="#"` es el patrón clásico de un botón
    // disfrazado de link: rescatarlo sería recargar la página porque sí.
    expect(
      destinoARescatar(click({ href: "https://www.uiabconecta.com/directorio" }))
    ).toBeNull();
    expect(
      destinoARescatar(click({ href: "https://www.uiabconecta.com/directorio#resultados" }))
    ).toBeNull();
  });

  it("sí vigila cuando sólo cambian los parámetros de búsqueda", () => {
    // /empresas?categoria=proveedores es una ruta distinta para el router
    // aunque el pathname sea el mismo.
    expect(
      destinoARescatar(
        click({
          urlActual: "https://www.uiabconecta.com/empresas",
          href: "https://www.uiabconecta.com/empresas?categoria=proveedores",
        })
      )
    ).toBe("https://www.uiabconecta.com/empresas?categoria=proveedores");
  });

  it("ignora un href que no se puede parsear", () => {
    expect(destinoARescatar(click({ href: "://roto" }))).toBeNull();
  });
});
