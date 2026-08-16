import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Red de contención contra los datos inventados.
 *
 * El sitio de la UIAB llegó a publicar: tres empresas que no existen
 * ("MetalTech Industrial SA", "QuímicaPro Solutions", "MaquinariasPrecision")
 * en la vista previa de /empresas; un testimonio fabricado con nombre y cargo
 * ("Roberto M., Director en Logística Brown") en la home; tres historias de
 * éxito inventadas con métricas ("+12 proyectos/año") en la landing de
 * prestadores; tres pedidos de cotización ficticios en /oportunidades
 * atribuidos a empresas que tampoco existen; y una docena de cifras sin
 * respaldo ("50+ proveedores" con 0 prestadores aprobados, "+600 conexiones
 * B2B", "145 licitaciones", una grilla de sectores cuyos números no se parecen
 * a la base).
 *
 * Ninguno era código muerto: todo se renderizaba y se le servía a Google.
 *
 * Es el sitio de una cámara empresaria: una afirmación falsa no es un detalle
 * de estilo. Este test falla si algo de eso vuelve a entrar.
 *
 * SI ESTE TEST TE FALLA: el número que querés mostrar salí a buscarlo a la
 * base y pasalo por props desde un Server Component, como hace
 * src/app/empresas/page.tsx con `sectores` y `totalEmpresas`. Un dato
 * hardcodeado en un componente de presentación envejece mal por definición.
 */

const RAIZ = process.cwd();
const DIRS = ["src/app", "src/components", "src/lib"];

/** Los comentarios de este repo NOMBRAN los datos viejos para explicarlos. */
function sinComentarios(fuente: string): string {
  return fuente
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
}

function archivos(dir: string, acc: string[] = []): string[] {
  for (const entrada of readdirSync(join(RAIZ, dir))) {
    const rel = join(dir, entrada);
    const abs = join(RAIZ, rel);
    if (statSync(abs).isDirectory()) archivos(rel, acc);
    else if (/\.tsx?$/.test(entrada) && !/\.test\.tsx?$/.test(entrada)) acc.push(rel);
  }
  return acc;
}

const FUENTES = DIRS.flatMap((d) => archivos(d)).map((ruta) => ({
  ruta: relative(RAIZ, ruta),
  codigo: sinComentarios(readFileSync(join(RAIZ, ruta), "utf8")),
}));

/** Entidades y personas que nunca existieron. */
const INVENTADOS = [
  "MetalTech",
  "QuímicaPro",
  "MaquinariasPrecision",
  "Roberto M.",
  "Logística Brown",
  "Ingeniería Martín",
  "Distribuidora Logística",
  "Laboratorio Farmacéutico",
  // 2026-08-13: el rediseño de /oportunidades volvió a inventar una empresa
  // ("Nueva Solicitud — Aserradero Los Robles S.A.") con cero solicitudes
  // reales. Esta lista atrapa reincidencias del nombre; la reincidencia de la
  // CLASE la atrapa el describe de "cifras hardcodeadas" de abajo.
  "Aserradero Los Robles",
];

/**
 * Cifras que se publicaban como hechos y que la base contradice. No es una
 * prohibición de usar números: es una prohibición de escribirlos a mano en un
 * componente. Los reales se derivan de Supabase.
 */
const CIFRAS_SIN_RESPALDO = [
  "50+",
  "+600",
  "+110",
  "+60 empresas",
  "+60 Empresas",
  "+60 Socios",
  "26 sectores",
  "Tiempo promedio de contacto",
  // Segunda camada, 2026-08-13 (/oportunidades): "+140 Licitaciones Activas" y
  // "20+ Nuevas / Semana" con cero oportunidades en la base, y "Hace 2 días"
  // fijo en cada tarjeta. Las dos primeras las cubre también la regla general;
  // el "Hace 2 días" va como cadena porque la edad se calcula (publicadaHace).
  "+140",
  "Nuevas / Semana",
  "Hace 2 días",
];

describe("no se publican datos inventados", () => {
  it.each(INVENTADOS)("ninguna página menciona %s", (aguja) => {
    const culpables = FUENTES.filter((f) => f.codigo.includes(aguja)).map((f) => f.ruta);
    expect(culpables, `"${aguja}" no existe: es una entidad inventada`).toEqual([]);
  });

  it.each(CIFRAS_SIN_RESPALDO)("ninguna página afirma %s", (aguja) => {
    const culpables = FUENTES.filter((f) => f.codigo.includes(aguja)).map((f) => f.ruta);
    expect(
      culpables,
      `"${aguja}" es una cifra escrita a mano. Derivala de la base y pasala por props.`
    ).toEqual([]);
  });

  it("el archivo de datos mock ya no exporta empresas", () => {
    // Sobrevive sólo el tipo `Entidad`, que se usa en todo el proyecto.
    const fuente = readFileSync(join(RAIZ, "src/lib/datos/directorio.ts"), "utf8");
    expect(fuente).not.toContain("export const entidades");
    expect(fuente).not.toContain("export function getEmpresas");
    expect(fuente).toContain("export interface Entidad");
  });

  it("/empresas/[slug] no tiene loading.tsx (reintroduce el soft 404)", () => {
    // El notFound() de la ficha corre DESPUÉS de que loading.tsx hace flush del
    // shell, y el status HTTP viaja en esa primera cabecera: un slug inexistente
    // devolvía 200 con la pantalla de error. Importa acá más que en otras rutas
    // porque el slug se recalcula de `razon_social` en cada render, así que
    // renombrar una socia convierte su URL ya indexada en un soft 404
    // permanente. El detalle está en POR-QUE-NO-HAY-LOADING.md, al lado.
    const existe = (() => {
      try {
        readFileSync(join(RAIZ, "src/app/empresas/[slug]/loading.tsx"), "utf8");
        return true;
      } catch {
        return false;
      }
    })();
    expect(existe, "volver a poner loading.tsx hace que un slug inexistente devuelva 200").toBe(
      false
    );
  });

  /**
   * La regla GENERAL detrás de las listas de arriba.
   *
   * Las listas negras de cadenas exactas perdieron dos veces: la purga del
   * 04/08 baneó "145 licitaciones" y "+600", y el 13/08 volvió la misma clase
   * de invento con cadenas nuevas ("+140", "20+") que pasaron el test en
   * verde. El patrón común de todas las reincidencias fue una tarjeta de
   * estadísticas con el número escrito a mano: `{ val: "20+", ... }`.
   *
   * Por eso acá se prohíbe el PATRÓN: ningún literal `val:` con dígitos en un
   * componente. Un número real se busca en la base y baja por props como
   * expresión (`val: String(totalEmpresas)`), que esta regex no matchea.
   */
  it("ninguna tarjeta de estadísticas tiene un número escrito a mano", () => {
    const regla = /val:\s*["'`][^"'`\n]*\d/;
    const culpables = FUENTES.filter((f) => regla.test(f.codigo)).map((f) => f.ruta);
    expect(
      culpables,
      "hay un `val:` con dígitos hardcodeado: derivá el número de la base y pasalo por props"
    ).toEqual([]);
  });

  it("no hay reseñas ni ratings inventados en el marcado", () => {
    // `resenas` aprobadas = 0. Un aggregateRating sin reseñas visibles es
    // motivo de acción manual por spam de datos estructurados.
    for (const f of FUENTES) {
      expect(f.codigo, `${f.ruta} declara aggregateRating`).not.toContain("aggregateRating");
    }
  });
});
