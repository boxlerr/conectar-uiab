import { describe, expect, it } from "vitest";
import { recalcularMatchesDeOportunidad } from "@/modulos/oportunidades/calcular-matches";

/**
 * El cruce que llena "Candidatos recomendados".
 *
 * Vive en el código y no en la base porque `fn_calcular_matches_oportunidad`
 * nunca insertó una fila en producción y encima borra al tocar las etiquetas
 * (ver el comentario de cabecera de calcular-matches.ts). Estos tests son la
 * red que evita que vuelva a quedar vacío en silencio.
 */

const OP = "11111111-1111-1111-1111-111111111111";

const TAG_REDES = "aaaaaaaa-0000-0000-0000-000000000001";
const TAG_CABLEADO = "aaaaaaaa-0000-0000-0000-000000000002";
const TAG_AJENA = "aaaaaaaa-0000-0000-0000-000000000003";
const RUBRO = "bbbbbbbb-0000-0000-0000-000000000001";

interface Escenario {
  oportunidad: Record<string, unknown>;
  tagsOportunidad: { tag_id: string; tags: { nombre: string } }[];
  empresas: Record<string, unknown>[];
}

/** Supabase de mentira: responde las consultas que hace el módulo y registra
 *  lo que se habría insertado. */
function supabaseFalso(escenario: Escenario) {
  const insertadas: Record<string, unknown>[] = [];
  let borro = false;

  const cliente = {
    from(tabla: string) {
      const constructor: Record<string, unknown> = {
        select: () => constructor,
        eq: () => constructor,
        in: () => constructor,
        maybeSingle: async () => {
          if (tabla === "oportunidades") return { data: escenario.oportunidad };
          if (tabla === "categorias") return { data: { nombre: "Telecomunicaciones y Redes" } };
          return { data: null };
        },
        delete: () => {
          borro = true;
          return { eq: async () => ({ error: null }) };
        },
        insert: async (filas: Record<string, unknown>[]) => {
          insertadas.push(...filas);
          return { error: null };
        },
        then: undefined,
      };

      // Las consultas que se resuelven sin maybeSingle devuelven { data }.
      const conDatos = (datos: unknown) =>
        Object.assign(constructor, {
          eq: async () => ({ data: datos }),
          in: async () => ({ data: datos }),
        });

      if (tabla === "oportunidades_tags") return conDatos(escenario.tagsOportunidad);
      if (tabla === "empresas") return conDatos(escenario.empresas);
      if (tabla === "proveedores") return conDatos([]);
      return constructor;
    },
  };

  return { cliente, insertadas, borroPrimero: () => borro };
}

const OPORTUNIDAD_BASE = {
  id: OP,
  categoria_id: RUBRO,
  localidad: "Burzaco, Provincia de Buenos Aires",
  empresa_solicitante_id: "empresa-que-publica",
  proveedor_solicitante_id: null,
};

const TAGS_BASE = [
  { tag_id: TAG_REDES, tags: { nombre: "Redes industriales" } },
  { tag_id: TAG_CABLEADO, tags: { nombre: "Cableado industrial" } },
];

describe("candidatos recomendados", () => {
  it("puntúa etiquetas, rubro y cercanía, y ordena por puntaje", async () => {
    const { cliente, insertadas } = supabaseFalso({
      oportunidad: OPORTUNIDAD_BASE,
      tagsOportunidad: TAGS_BASE,
      empresas: [
        {
          id: "e-dos-tags-misma-zona",
          razon_social: "Dos etiquetas y cerca",
          localidad: "Burzaco",
          empresas_tags: [{ tag_id: TAG_REDES }, { tag_id: TAG_CABLEADO }],
          empresas_categorias: [],
        },
        {
          id: "e-una-tag-lejos",
          razon_social: "Una etiqueta y lejos",
          localidad: "Adrogué",
          empresas_tags: [{ tag_id: TAG_REDES }],
          empresas_categorias: [],
        },
      ],
    });

    const total = await recalcularMatchesDeOportunidad(cliente as never, OP);

    expect(total).toBe(2);
    // 2 etiquetas (40) + misma zona (10) = 50, contra 1 etiqueta (20).
    expect(insertadas[0].empresa_candidata_id).toBe("e-dos-tags-misma-zona");
    expect(insertadas[0].puntaje).toBe(50);
    expect(insertadas[1].puntaje).toBe(20);
  });

  it("estar cerca no alcanza: sin etiqueta ni rubro no es candidato", async () => {
    const { cliente, insertadas } = supabaseFalso({
      oportunidad: OPORTUNIDAD_BASE,
      tagsOportunidad: TAGS_BASE,
      empresas: [
        {
          // Una pinturería del barrio no sirve para un cableado estructurado.
          id: "e-vecina-sin-relacion",
          razon_social: "Pinturería de la esquina",
          localidad: "Burzaco",
          empresas_tags: [{ tag_id: TAG_AJENA }],
          empresas_categorias: [],
        },
      ],
    });

    expect(await recalcularMatchesDeOportunidad(cliente as never, OP)).toBe(0);
    expect(insertadas).toHaveLength(0);
  });

  it("deja afuera a quien no coincide en nada", async () => {
    const { cliente, insertadas } = supabaseFalso({
      oportunidad: OPORTUNIDAD_BASE,
      tagsOportunidad: TAGS_BASE,
      empresas: [
        {
          id: "e-sin-relacion",
          razon_social: "Nada que ver",
          localidad: "Rosario",
          empresas_tags: [{ tag_id: TAG_AJENA }],
          empresas_categorias: [],
        },
      ],
    });

    expect(await recalcularMatchesDeOportunidad(cliente as never, OP)).toBe(0);
    expect(insertadas).toHaveLength(0);
  });

  it("nunca se recomienda a sí misma la ficha que publica", async () => {
    const { cliente, insertadas } = supabaseFalso({
      oportunidad: OPORTUNIDAD_BASE,
      tagsOportunidad: TAGS_BASE,
      empresas: [
        {
          id: "empresa-que-publica",
          razon_social: "La que publicó",
          localidad: "Burzaco",
          empresas_tags: [{ tag_id: TAG_REDES }, { tag_id: TAG_CABLEADO }],
          empresas_categorias: [{ categoria_id: RUBRO }],
        },
      ],
    });

    expect(await recalcularMatchesDeOportunidad(cliente as never, OP)).toBe(0);
    expect(insertadas).toHaveLength(0);
  });

  it("cuenta el rubro y explica el motivo con datos reales", async () => {
    const { cliente, insertadas } = supabaseFalso({
      oportunidad: OPORTUNIDAD_BASE,
      tagsOportunidad: TAGS_BASE,
      empresas: [
        {
          id: "e-mismo-rubro",
          razon_social: "Del palo",
          localidad: "Burzaco",
          empresas_tags: [{ tag_id: TAG_REDES }],
          empresas_categorias: [{ categoria_id: RUBRO }],
        },
      ],
    });

    await recalcularMatchesDeOportunidad(cliente as never, OP);

    // 1 etiqueta (20) + rubro (30) + zona (10)
    expect(insertadas[0].puntaje).toBe(60);
    const motivo = insertadas[0].motivo_match as string;
    expect(motivo).toContain("Redes industriales");
    expect(motivo).toContain("Telecomunicaciones y Redes");
    expect(motivo).toContain("misma zona");
    // El motivo describe coincidencias reales: nunca inventa un puntaje ni una
    // reseña (ver la memoria de datos inventados).
    expect(motivo).not.toMatch(/\d+(,\d+)?\s*(estrellas?|★)/i);
  });

  it("'Burzaco' y 'Burzaco, Provincia de Buenos Aires' son la misma zona", async () => {
    const { cliente, insertadas } = supabaseFalso({
      oportunidad: OPORTUNIDAD_BASE,
      tagsOportunidad: TAGS_BASE,
      empresas: [
        {
          id: "e-cerca",
          razon_social: "Vecina",
          localidad: "burzaco",
          empresas_tags: [{ tag_id: TAG_REDES }],
          empresas_categorias: [],
        },
      ],
    });

    await recalcularMatchesDeOportunidad(cliente as never, OP);
    expect((insertadas[0].detalle_puntaje as { ubicacion: number }).ubicacion).toBe(10);
  });

  it("borra los previos aunque el cruce nuevo quede vacío", async () => {
    const { cliente, borroPrimero } = supabaseFalso({
      oportunidad: OPORTUNIDAD_BASE,
      tagsOportunidad: TAGS_BASE,
      empresas: [],
    });

    await recalcularMatchesDeOportunidad(cliente as never, OP);
    // Si no borrara, sobrevivirían candidatos de una versión anterior de las
    // etiquetas y la lista mentiría.
    expect(borroPrimero()).toBe(true);
  });
});
