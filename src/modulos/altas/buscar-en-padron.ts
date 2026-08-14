/**
 * Busca una empresa en el padrón UIAB.
 *
 * Item 1.3 del reporte de Lucas: "no existe un control contra el padrón de la
 * UIAB que determine si el acceso corresponde bonificado (socio) o arancelado
 * (no socio)". `/register` insertaba una empresa nueva a ciegas, así que
 * Metalúrgica Longchamps — socia, con ficha aprobada y suscripción activa —
 * terminó duplicada: la del padrón con CUIT "30-71232689-8" y la que creó Lucas
 * con "30712326898". El mismo CUIT escrito distinto.
 *
 * El CUIT solo no alcanza. El 2026-08-13 pasó de nuevo con Transporte Gav, y esta
 * vez el CUIT no tenía nada que ver: la ficha del padrón NO lo tiene cargado (6
 * de las 63 están así), así que la comparación no tenía contra qué correr y la
 * empresa terminó con ficha nueva, cobrándosele el canon siendo socia. Por eso
 * ahora se busca en tres pasadas, de más a menos confiable:
 *
 *   1. `cuit`   — CUIT normalizado a dígitos de los dos lados.
 *   2. `nombre` — razón social o nombre comercial normalizados (sin acentos, sin
 *                 puntuación y sin la forma societaria del final).
 *   3. `nombre_parcial` — el nombre de una está contenido en el de la otra:
 *                 "Transporte Gav" contra "EMPRESA TRANSPORTE GAV SRL".
 *
 * La pasada 3 es la única que puede equivocarse, y por eso viaja etiquetada: quien
 * la use tiene que dejar el acceso en manos de un admin en vez de habilitarlo
 * solo. Contra el padrón real (63 fichas) no produce ningún falso positivo; el
 * único par que empareja es justamente Transporte Gav.
 *
 * Módulo puro (sin "use server" ni "server-only"): recibe el cliente Supabase
 * ya construido, así lo pueden usar tanto un route handler como una acción.
 */

import { nombreContenido, normalizarCuit, normalizarNombreEmpresa } from "./padron";

/** Con qué dato se encontró la ficha. Ordenadas de más a menos confiable. */
export type TipoCoincidencia = "cuit" | "nombre" | "nombre_parcial";

export interface EmpresaDelPadron {
  id: string;
  razon_social: string | null;
  /** Número de socia. Sólo referencia: NO decide el acceso bonificado. */
  n_socio: string | null;
  /** True = socia UIAB, le corresponde acceso bonificado. */
  es_socia_uiab: boolean | null;
  estado: string | null;
  /** Con qué dato matcheó. `nombre_parcial` es una corazonada, no una certeza. */
  coincidencia: TipoCoincidencia;
}

/** Lo que sabemos de quien se está registrando. Alcanza con uno de los tres. */
export interface CriterioPadron {
  cuit?: string | null;
  razonSocial?: string | null;
  nombreComercial?: string | null;
}

export interface ResultadoPadron {
  empresa: EmpresaDelPadron | null;
  /**
   * Hubo más de una ficha compitiendo por el mismo dato. No elegimos: eso es un
   * duplicado dentro del propio padrón y lo resuelve un admin.
   */
  ambiguo: boolean;
  /** Ids de las fichas que empataron, para poder nombrarlas en el aviso. */
  candidatas: string[];
}

/**
 * Lo mínimo que necesitamos de un cliente Supabase, para poder pasar tanto el
 * real como un doble de test.
 */
interface ClienteMinimo {
  from(tabla: string): {
    select(cols: string): PromiseLike<{ data: unknown[] | null }>;
  };
}

type FilaPadron = {
  id: string;
  razon_social: string | null;
  nombre_comercial: string | null;
  cuit: string | null;
  n_socio: string | null;
  es_socia_uiab: boolean | null;
  estado: string | null;
};

/** Devolvemos sólo lo que necesita quien decide. El CUIT queda afuera a
 * propósito: no hace falta para resolver socia/no socia y no tiene por qué
 * viajar a la respuesta de un endpoint público como check-cuit. */
function aResultado(fila: FilaPadron, coincidencia: TipoCoincidencia): EmpresaDelPadron {
  return {
    id: fila.id,
    razon_social: fila.razon_social,
    n_socio: fila.n_socio,
    es_socia_uiab: fila.es_socia_uiab,
    estado: fila.estado,
    coincidencia,
  };
}

/**
 * La ficha del padrón que corresponde a esos datos, con el detalle de cómo se
 * llegó a ella y si hubo empate.
 */
export async function buscarEnPadron(
  db: ClienteMinimo,
  criterio: CriterioPadron
): Promise<ResultadoPadron> {
  const vacio: ResultadoPadron = { empresa: null, ambiguo: false, candidatas: [] };

  const cuit = normalizarCuit(criterio.cuit);
  const nombres = [criterio.razonSocial, criterio.nombreComercial].filter(
    (n): n is string => typeof n === "string" && normalizarNombreEmpresa(n).length > 0
  );
  if (!cuit && nombres.length === 0) return vacio;

  // Se trae el padrón entero y se compara en memoria: normalizar de los dos lados
  // no se puede expresar en el filtro de PostgREST, y son ~60 filas. Si algún día
  // crece, esto va a columnas normalizadas con índice.
  const { data } = await db
    .from("empresas")
    .select("id, razon_social, nombre_comercial, cuit, n_socio, es_socia_uiab, estado");

  // Las rechazadas quedan afuera de las tres pasadas: son las fichas que un
  // admin retiró justamente por duplicadas ("Pinturería Giannoni [DUPLICADA —
  // retirada 2026-08-04]") y empatan por nombre con la buena. Vincular a una de
  // ésas sería reabrir el bug.
  const todas = (data ?? []) as FilaPadron[];
  const filas = todas.filter((e) => e.estado !== "rechazada");
  const rechazadas = todas.filter((e) => e.estado === "rechazada");

  const resolver = (
    coincidencias: FilaPadron[],
    tipo: TipoCoincidencia
  ): ResultadoPadron | null => {
    if (coincidencias.length === 0) return null;
    if (coincidencias.length > 1) {
      return { empresa: null, ambiguo: true, candidatas: coincidencias.map((c) => c.id) };
    }
    return {
      empresa: aResultado(coincidencias[0], tipo),
      ambiguo: false,
      candidatas: [coincidencias[0].id],
    };
  };

  // 1. CUIT.
  if (cuit) {
    const porCuit = resolver(
      filas.filter((e) => normalizarCuit(e.cuit) === cuit),
      "cuit"
    );
    if (porCuit) return porCuit;
  }

  const buscados = nombres.map(normalizarNombreEmpresa);

  // Las pasadas 2 y 3 necesitan un nombre; la 4 corre igual (puede haber una
  // retirada que se quedó con el CUIT).
  if (nombres.length > 0) {
    // 2. Nombre exacto (contra razón social y contra nombre comercial).
    const porNombre = resolver(
      filas.filter((e) =>
        [e.razon_social, e.nombre_comercial]
          .map(normalizarNombreEmpresa)
          .some((n) => n.length > 0 && buscados.includes(n))
      ),
      "nombre"
    );
    if (porNombre) return porNombre;

    // 3. Nombre contenido. Es la pasada que puede errar: se marca y se revisa.
    const porParcial = resolver(
      filas.filter((e) =>
        nombres.some(
          (n) => nombreContenido(n, e.razon_social) || nombreContenido(n, e.nombre_comercial)
        )
      ),
      "nombre_parcial"
    );
    if (porParcial) return porParcial;
  }

  // 4. Última red: ¿coincide con una ficha RETIRADA?
  //
  // No se vincula —para eso se la retiró— pero tampoco se puede seguir de largo,
  // por dos motivos. Uno, `empresas.cuit` tiene índice único: si la retirada se
  // quedó con el CUIT (le pasa a "Metalurgica Longchamps SRL [DUPLICADA]", que
  // todavía tiene 30712326898), crear una ficha nueva con ese mismo CUIT explota
  // con un 23505 y el alta se cae con un 500 sin explicación. Dos, que alguien
  // vuelva a registrar una empresa que un admin retiró a mano es exactamente el
  // caso que quiere ver un humano.
  //
  // Se devuelve como `ambiguo`: sin ficha, pero avisando que no siga solo.
  const retiradas = rechazadas.filter(
    (e) =>
      (cuit && normalizarCuit(e.cuit) === cuit) ||
      buscados.includes(normalizarNombreEmpresa(e.razon_social)) ||
      nombres.some((n) => nombreContenido(n, e.razon_social))
  );
  if (retiradas.length > 0) {
    return { empresa: null, ambiguo: true, candidatas: retiradas.map((e) => e.id) };
  }

  return vacio;
}

/**
 * Atajo para quien sólo quiere la ficha. Con empate devuelve null, igual que
 * antes: un duplicado dentro del padrón lo resuelve un admin, no nosotros.
 */
export async function buscarEmpresaEnPadron(
  db: ClienteMinimo,
  criterio: CriterioPadron
): Promise<EmpresaDelPadron | null> {
  return (await buscarEnPadron(db, criterio)).empresa;
}

/**
 * True si esa ficha del padrón corresponde a una socia (acceso bonificado).
 *
 * Mira `es_socia_uiab`, no `n_socio`: el número es opcional en el alta y había
 * 9 socias reales sin él, a las que el sistema les cobraba (20260804_es_socia_uiab).
 */
export function esSocia(empresa: EmpresaDelPadron | null): boolean {
  return Boolean(empresa?.es_socia_uiab);
}

/**
 * True si el match es lo bastante firme como para habilitar el acceso sin que
 * mire un humano. `nombre_parcial` no lo es.
 */
export function coincidenciaConfiable(empresa: EmpresaDelPadron | null): boolean {
  return empresa?.coincidencia === "cuit" || empresa?.coincidencia === "nombre";
}
