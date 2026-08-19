import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CANDIDATOS RECOMENDADOS — el cruce, calculado acá y no en la base
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 *
 * El cruce lo hacía `fn_calcular_matches_oportunidad`, un trigger sobre
 * `oportunidades_tags`. Esa función está rota: en producción NUNCA insertó una
 * sola fila en `oportunidades_matches` (verificado el 19-ago-2026 sobre una
 * oportunidad de "Telecomunicaciones y Redes" cuyas etiquetas comparten cuatro
 * socias de Burzaco — devolvió cero). Peor: sí llega al DELETE, así que cada
 * vez que se tocan las etiquetas BORRA los candidatos que hubiera y no repone
 * ninguno. Su cuerpo no está en `supabase/migrations/` (drift), así que no se
 * puede arreglar desde el repo.
 *
 * La consecuencia de producto era que "Candidatos recomendados" estaba vacío
 * siempre — o sea, la promesa central de publicar en la red no se cumplía.
 *
 * Calcularlo acá lo vuelve reparable, testeable y visible en el diff. Corre
 * después de guardar las etiquetas (al publicar y al editar), así que si el
 * trigger viejo borra, esto repone a continuación y gana igual.
 *
 * EL CRITERIO
 *
 * Suma tres señales, de la más específica a la más general:
 *   · etiquetas en común  → 20 c/u  (lo que mejor describe el trabajo)
 *   · mismo rubro         → 30      (la categoría de la oportunidad)
 *   · misma localidad     → 10      (un flete corto define muchas compras)
 *
 * La cercanía SUMA pero no habilita: para entrar en la lista hay que coincidir
 * en al menos una etiqueta o en el rubro. Sin esa regla, un pedido de cableado
 * estructurado en Burzaco devolvía 24 candidatos, 18 de ellos con el único
 * mérito de estar en Burzaco —una pinturería, una papelera, un transporte—, y
 * la sección dejaba de ser una recomendación para ser una guía telefónica.
 */

/** Puntos por cada etiqueta que el candidato comparte con la oportunidad. */
const PUNTOS_POR_ETIQUETA = 20;
/** Puntos por estar en el mismo rubro que el pedido. */
const PUNTOS_CATEGORIA = 30;
/** Puntos por estar en la misma localidad. */
const PUNTOS_UBICACION = 10;
/** Tope de candidatos guardados por oportunidad. */
const MAX_CANDIDATOS = 24;

interface Candidato {
  empresaId: string | null;
  proveedorId: string | null;
  nombre: string;
  localidad: string | null;
  tagIds: Set<string>;
  categoriaIds: Set<string>;
}

/** "Burzaco, Provincia de Buenos Aires" y "Burzaco" son la misma localidad. */
function normalizarLocalidad(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const primera = valor.split(",")[0] ?? valor;
  const limpia = primera
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
  return limpia || null;
}

/** El "por qué" en palabras, con los datos que de verdad coincidieron. */
function redactarMotivo(
  etiquetasEnComun: string[],
  mismoRubro: boolean,
  mismaZona: boolean,
  rubro: string | null
): string {
  const partes: string[] = [];

  if (etiquetasEnComun.length === 1) {
    partes.push(`comparte la etiqueta ${etiquetasEnComun[0]} con tu pedido`);
  } else if (etiquetasEnComun.length === 2) {
    partes.push(
      `comparte dos etiquetas con tu pedido (${etiquetasEnComun[0]} y ${etiquetasEnComun[1]})`
    );
  } else if (etiquetasEnComun.length > 2) {
    const visibles = etiquetasEnComun.slice(0, 3);
    partes.push(
      `comparte ${etiquetasEnComun.length} etiquetas con tu pedido (${visibles
        .slice(0, -1)
        .join(", ")} y ${visibles[visibles.length - 1]})`
    );
  }

  if (mismoRubro && rubro) partes.push(`trabaja en ${rubro}`);
  if (mismaZona) partes.push("está en tu misma zona");

  if (partes.length === 0) return "Coincide con tu pedido.";

  const frase =
    partes.length === 1
      ? partes[0]
      : `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;

  return frase.charAt(0).toUpperCase() + frase.slice(1) + ".";
}

/**
 * Recalcula y guarda los candidatos de una oportunidad.
 *
 * Tolerante a fallos: si algo sale mal devuelve 0 y loguea, porque se llama
 * después de publicar o editar y no puede tumbar esa operación — la
 * oportunidad ya está guardada y el usuario está esperando la redirección.
 *
 * Necesita un cliente con service role: cruza TODO el padrón, y las policies
 * de `empresas_tags` no dejan que un socio lea las etiquetas del resto.
 */
export async function recalcularMatchesDeOportunidad(
  admin: SupabaseClient,
  oportunidadId: string
): Promise<number> {
  try {
    const { data: op } = await admin
      .from("oportunidades")
      .select("id, categoria_id, localidad, empresa_solicitante_id, proveedor_solicitante_id")
      .eq("id", oportunidadId)
      .maybeSingle();

    if (!op) return 0;

    const [{ data: tagsDeLaOp }, { data: categoria }] = await Promise.all([
      admin
        .from("oportunidades_tags")
        .select("tag_id, tags(nombre)")
        .eq("oportunidad_id", oportunidadId),
      op.categoria_id
        ? admin.from("categorias").select("nombre").eq("id", op.categoria_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const nombrePorTag = new Map<string, string>();
    for (const fila of tagsDeLaOp ?? []) {
      const nombre = (fila as { tags?: { nombre?: string } | null }).tags?.nombre;
      if (fila.tag_id && nombre) nombrePorTag.set(fila.tag_id as string, nombre);
    }
    const tagsOp = new Set(nombrePorTag.keys());
    const localidadOp = normalizarLocalidad(op.localidad);
    const nombreRubro = (categoria as { nombre?: string } | null)?.nombre ?? null;

    // Sin ninguna señal no hay nada que cruzar: la oportunidad no tiene
    // etiquetas, ni rubro, ni localidad.
    if (tagsOp.size === 0 && !op.categoria_id && !localidadOp) return 0;

    const candidatos = await reunirCandidatos(admin);

    const filas = candidatos
      .filter(
        (candidato) =>
          // Nadie se recomienda a sí mismo.
          !(candidato.empresaId && candidato.empresaId === op.empresa_solicitante_id) &&
          !(candidato.proveedorId && candidato.proveedorId === op.proveedor_solicitante_id)
      )
      .map((candidato) => {
        const etiquetasEnComun = [...candidato.tagIds]
          .filter((tagId) => tagsOp.has(tagId))
          .map((tagId) => nombrePorTag.get(tagId))
          .filter((nombre): nombre is string => Boolean(nombre));

        const mismoRubro = Boolean(
          op.categoria_id && candidato.categoriaIds.has(op.categoria_id as string)
        );
        const mismaZona = Boolean(
          localidadOp && normalizarLocalidad(candidato.localidad) === localidadOp
        );

        const detalle = {
          tags: etiquetasEnComun.length * PUNTOS_POR_ETIQUETA,
          categoria: mismoRubro ? PUNTOS_CATEGORIA : 0,
          ubicacion: mismaZona ? PUNTOS_UBICACION : 0,
        };
        const puntaje = detalle.tags + detalle.categoria + detalle.ubicacion;

        return {
          oportunidad_id: oportunidadId,
          empresa_candidata_id: candidato.empresaId,
          proveedor_candidato_id: candidato.proveedorId,
          puntaje,
          detalle_puntaje: detalle,
          estado: "sugerido",
          motivo_match: redactarMotivo(
            etiquetasEnComun,
            mismoRubro,
            mismaZona,
            nombreRubro
          ),
        };
      })
      // Estar cerca no alcanza para ser candidato: hace falta afinidad real.
      .filter(
        (fila) => fila.detalle_puntaje.tags > 0 || fila.detalle_puntaje.categoria > 0
      )
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, MAX_CANDIDATOS);

    // Reemplazo completo: este cálculo es la fuente de verdad de la lista.
    // Se borra siempre, incluso si `filas` queda vacío, para que no sobrevivan
    // candidatos de una versión anterior de las etiquetas.
    const { error: errorBorrado } = await admin
      .from("oportunidades_matches")
      .delete()
      .eq("oportunidad_id", oportunidadId);

    if (errorBorrado) {
      console.error("[matches] no se pudieron limpiar los previos:", errorBorrado);
      return 0;
    }

    if (filas.length === 0) return 0;

    const { error: errorInsert } = await admin
      .from("oportunidades_matches")
      .insert(filas);

    if (errorInsert) {
      console.error("[matches] no se pudieron guardar:", errorInsert);
      return 0;
    }

    return filas.length;
  } catch (err) {
    console.error("[matches] error inesperado al recalcular:", err);
    return 0;
  }
}

/** Empresas y proveedores aprobados, con sus etiquetas y rubros. */
async function reunirCandidatos(admin: SupabaseClient): Promise<Candidato[]> {
  const [{ data: empresas }, { data: proveedores }] = await Promise.all([
    admin
      .from("empresas")
      .select(
        "id, razon_social, nombre_comercial, localidad, empresas_tags(tag_id), empresas_categorias(categoria_id)"
      )
      .eq("estado", "aprobada"),
    admin
      .from("proveedores")
      .select(
        "id, nombre, nombre_comercial, localidad, proveedores_tags(tag_id), proveedores_categorias(categoria_id)"
      )
      .in("estado", ["aprobado", "aprobada"]),
  ]);

  const candidatos: Candidato[] = [];

  for (const empresa of empresas ?? []) {
    candidatos.push({
      empresaId: empresa.id as string,
      proveedorId: null,
      nombre: (empresa.nombre_comercial || empresa.razon_social) as string,
      localidad: (empresa.localidad as string | null) ?? null,
      tagIds: new Set(
        ((empresa.empresas_tags ?? []) as { tag_id: string }[]).map((t) => t.tag_id)
      ),
      categoriaIds: new Set(
        ((empresa.empresas_categorias ?? []) as { categoria_id: string }[]).map(
          (c) => c.categoria_id
        )
      ),
    });
  }

  for (const proveedor of proveedores ?? []) {
    candidatos.push({
      empresaId: null,
      proveedorId: proveedor.id as string,
      nombre: (proveedor.nombre_comercial || proveedor.nombre) as string,
      localidad: (proveedor.localidad as string | null) ?? null,
      tagIds: new Set(
        ((proveedor.proveedores_tags ?? []) as { tag_id: string }[]).map((t) => t.tag_id)
      ),
      categoriaIds: new Set(
        ((proveedor.proveedores_categorias ?? []) as { categoria_id: string }[]).map(
          (c) => c.categoria_id
        )
      ),
    });
  }

  return candidatos;
}
