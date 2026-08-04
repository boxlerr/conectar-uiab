/**
 * Busca una empresa en el padrón UIAB por CUIT.
 *
 * Item 1.3 del reporte de Lucas: "no existe un control contra el padrón de la
 * UIAB que determine si el acceso corresponde bonificado (socio) o arancelado
 * (no socio)". `/register` insertaba una empresa nueva a ciegas, así que
 * Metalúrgica Longchamps — socia, con ficha aprobada y suscripción activa —
 * terminó duplicada: la del padrón con CUIT "30-71232689-8" y la que creó Lucas
 * con "30712326898". El mismo CUIT escrito distinto.
 *
 * La comparación se hace normalizando a dígitos de los dos lados, porque el
 * padrón importado tiene formatos mezclados. Igual criterio que usa el alta de
 * /sumate para reusar la ficha del padrón.
 *
 * Módulo puro (sin "use server" ni "server-only"): recibe el cliente Supabase
 * ya construido, así lo pueden usar tanto un route handler como una acción.
 */

import { normalizarCuit } from "./padron";

export interface EmpresaDelPadron {
  id: string;
  razon_social: string | null;
  /** Número de socia. Sólo referencia: NO decide el acceso bonificado. */
  n_socio: string | null;
  /** True = socia UIAB, le corresponde acceso bonificado. */
  es_socia_uiab: boolean | null;
  estado: string | null;
}

/**
 * Lo mínimo que necesitamos de un cliente Supabase, para poder pasar tanto el
 * real como un doble de test. Va con sintaxis de método (y no como propiedad de
 * tipo función) a propósito: así TypeScript compara los parámetros de forma
 * bivariante y el cliente real, cuyo `not` declara un `FilterOperator` más
 * angosto que `string`, encaja igual.
 */
interface ClienteMinimo {
  from(tabla: string): {
    select(cols: string): {
      not(col: string, op: 'is', val: null): PromiseLike<{ data: unknown[] | null }>;
    };
  };
}

/**
 * La empresa del padrón que matchea ese CUIT, o null si no hay ninguna.
 *
 * Devuelve null también cuando hay MÁS DE UNA coincidencia: eso es un CUIT
 * duplicado dentro del propio padrón y no queremos elegir por nuestra cuenta a
 * cuál ficha vincular. Mismo criterio que `crearCuentaDesdeAlta`.
 */
export async function buscarEmpresaEnPadron(
  db: ClienteMinimo,
  cuit: string | null | undefined
): Promise<EmpresaDelPadron | null> {
  const buscado = normalizarCuit(cuit);
  if (!buscado) return null;

  // Traemos las que tienen CUIT y filtramos en memoria: no se puede comparar
  // normalizado en SQL sin una expresión sobre la columna, y el padrón son ~60
  // filas. Si algún día crece, esto va a un índice funcional.
  const { data } = await db
    .from("empresas")
    .select("id, razon_social, cuit, n_socio, es_socia_uiab, estado")
    .not("cuit", "is", null);

  const filas = (data ?? []) as Array<EmpresaDelPadron & { cuit: string | null }>;
  const coincidencias = filas.filter((e) => normalizarCuit(e.cuit) === buscado);

  if (coincidencias.length !== 1) return null;

  // Devolvemos sólo lo que necesita quien decide. El CUIT queda afuera a
  // propósito: no hace falta para resolver socia/no socia y no tiene por qué
  // viajar a la respuesta de un endpoint público como check-cuit.
  const encontrada = coincidencias[0];
  return {
    id: encontrada.id,
    razon_social: encontrada.razon_social,
    n_socio: encontrada.n_socio,
    es_socia_uiab: encontrada.es_socia_uiab,
    estado: encontrada.estado,
  };
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
