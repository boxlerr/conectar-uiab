import { describe, expect, it } from "vitest";
import { filtrarCategoriasJerarquicas } from "@/modulos/compartido/buscador-categorias";

/**
 * El buscador de rubros del registro mostraba "Sin coincidencias" al buscar una
 * especialidad por su nombre ("Torner", "Soldadura") porque la lista se armaba
 * sólo con los macro-rubros que coincidían. Los nombres son los del catálogo
 * real (GET /api/categorias, 2026-10-15), en el orden en que los devuelve.
 */
const METALMECANICA = { id: "metal", nombre: "METALMECÁNICA Y METALURGIA", categoria_padre_id: null };
const MANTENIMIENTO = { id: "mant", nombre: "MANTENIMIENTO INDUSTRIAL (SERVICIOS)", categoria_padre_id: null };
const METALURGICA = { id: "metalurgica", nombre: "Metalúrgica", categoria_padre_id: null };
const TORNERIA = { id: "torneria", nombre: "Tornería y Mecanizado CNC", categoria_padre_id: "metal" };
const SOLDADURA_METAL = { id: "sold-metal", nombre: "Soldadura y Construcciones Metálicas", categoria_padre_id: "metal" };
const MATRICERIA = { id: "matriceria", nombre: "Matricería y Estampado", categoria_padre_id: "metal" };
const SOLDADURA_SERV = { id: "sold-serv", nombre: "Soldadura (Servicio)", categoria_padre_id: "mant" };

const CATALOGO = [MANTENIMIENTO, MATRICERIA, METALMECANICA, METALURGICA, SOLDADURA_SERV, SOLDADURA_METAL, TORNERIA];

/** Lo que se ve en la lista: raíz, si se ofrece "General", y los ids de las hijas. */
function vista(consulta: string) {
  return filtrarCategoriasJerarquicas(CATALOGO, consulta).map((g) => ({
    raiz: g.raiz.id,
    general: g.raizCoincide,
    hijas: g.hijas.map((h) => h.id),
  }));
}

describe("filtrarCategoriasJerarquicas", () => {
  it("encuentra una especialidad aunque su macro-rubro no coincida", () => {
    expect(vista("Torner")).toEqual([{ raiz: "metal", general: false, hijas: ["torneria"] }]);
  });

  it("muestra cada especialidad bajo su propio rubro cuando hay varias", () => {
    expect(vista("Soldadura")).toEqual([
      { raiz: "mant", general: false, hijas: ["sold-serv"] },
      { raiz: "metal", general: false, hijas: ["sold-metal"] },
    ]);
  });

  it("si coincide el rubro, lo trae entero con la opción General", () => {
    expect(vista("metalmecanica")).toEqual([
      { raiz: "metal", general: true, hijas: ["matriceria", "sold-metal", "torneria"] },
    ]);
  });

  it("no distingue tildes ni mayúsculas, en ninguno de los dos sentidos", () => {
    expect(vista("TORNERÍA")).toEqual(vista("torneria"));
    expect(vista("metálicas")).toEqual(vista("METALICAS"));
    expect(vista("metalicas")).toEqual([{ raiz: "metal", general: false, hijas: ["sold-metal"] }]);
  });

  it("'metal' encuentra también 'Metálicas', que antes se perdía por la tilde", () => {
    expect(vista("metal")).toEqual([
      { raiz: "metal", general: true, hijas: ["matriceria", "sold-metal", "torneria"] },
      { raiz: "metalurgica", general: true, hijas: [] },
    ]);
  });

  it("busca por palabras sueltas, repartidas entre la especialidad y su rubro", () => {
    expect(vista("cnc tornería")).toEqual([{ raiz: "metal", general: false, hijas: ["torneria"] }]);
    expect(vista("metalurgia soldadura")).toEqual([
      { raiz: "metal", general: false, hijas: ["sold-metal"] },
    ]);
  });

  it("sin búsqueda devuelve el árbol completo, en el orden recibido", () => {
    const todo = vista("   ");
    expect(todo.map((g) => g.raiz)).toEqual(["mant", "metal", "metalurgica"]);
    expect(todo.every((g) => g.general)).toBe(true);
    expect(todo.find((g) => g.raiz === "metal")?.hijas).toEqual(["matriceria", "sold-metal", "torneria"]);
  });

  it("sin coincidencias devuelve una lista vacía", () => {
    expect(vista("panadería")).toEqual([]);
  });

  // /perfil/servicios separa los rubros con especialidades (encabezado + hijas)
  // de los sueltos según `hijas.length`. Eso sólo vale si un grupo sin hijas es
  // siempre un rubro que no tiene ninguna, nunca uno al que se le filtraron.
  it("un grupo sin hijas es un rubro sin especialidades, con cualquier búsqueda", () => {
    const tieneHijasEnElCatalogo = (id: string) => CATALOGO.some((c) => c.categoria_padre_id === id);
    for (const consulta of ["", "metal", "metalmecanica", "metalurgia", "torner", "soldadura", "mantenimiento", "y"]) {
      for (const g of filtrarCategoriasJerarquicas(CATALOGO, consulta)) {
        if (g.hijas.length === 0) {
          expect(g.raizCoincide, `"${consulta}" → ${g.raiz.id}`).toBe(true);
          expect(tieneHijasEnElCatalogo(g.raiz.id), `"${consulta}" → ${g.raiz.id}`).toBe(false);
        }
      }
    }
  });

  it("ignora una hija cuyo padre no vino en la lista", () => {
    const huerfana = { id: "h", nombre: "Tornería huérfana", categoria_padre_id: "no-existe" };
    expect(filtrarCategoriasJerarquicas([...CATALOGO, huerfana], "huerfana")).toEqual([]);
  });
});
