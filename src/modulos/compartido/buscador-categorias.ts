import { normalizarTexto } from "./etiquetas";

/**
 * Filtro de los buscadores de rubro. Lo usan las tres pantallas que eligen una
 * categoría del catálogo:
 *  - el registro (`BuscadorJerarquico` en `register/page.tsx`),
 *  - el rubro de un producto o servicio (`CategoriaCombobox` en
 *    `perfil/productos-servicios/FormularioItem.tsx`),
 *  - las especialidades de la ficha (`perfil/servicios/page.tsx`).
 * Las tres tenían el mismo filtro copiado, con el mismo bug.
 *
 * El catálogo tiene dos niveles: macro-rubros ("METALMECÁNICA Y METALURGIA") y
 * especialidades colgadas de ellos ("Tornería y Mecanizado CNC"). La lista se
 * dibuja agrupada por raíz, así que el filtro devuelve grupos y no una lista
 * plana: cada grupo ya trae las hijas que hay que mostrar debajo.
 *
 * POR QUÉ ESTÁ ACÁ Y NO EN EL COMPONENTE
 *
 * El filtro plano sí encontraba "Tornería y Mecanizado CNC", pero la lista se
 * armaba sólo con las RAÍCES que habían pasado el filtro, y "METALMECÁNICA Y
 * METALURGIA" no contiene "torner". Resultado: "Sin coincidencias" para
 * cualquier especialidad buscada por su propio nombre, que es justamente como
 * la busca alguien que no conoce nuestra taxonomía. Salió filmando el video del
 * registro (2026-10-15): "Torner" y "Soldadura" no devolvían nada.
 *
 * Reglas:
 *  - Sin búsqueda, todo el árbol.
 *  - Si la raíz coincide, va con todas sus hijas (quien busca "metal" quiere
 *    ver el rubro entero).
 *  - Si sólo coinciden hijas, va la raíz con esas hijas nada más, y sin la
 *    opción de elegir la raíz misma ("General"): no es lo que se buscó.
 *  - Sin tildes ni mayúsculas, y por palabras: "metal soldadura" encuentra
 *    "Soldadura y Construcciones Metálicas" aunque las palabras no estén
 *    juntas ni en ese orden, y cada una puede caer en la hija o en su raíz.
 */

export interface CategoriaJerarquica {
  id: string;
  nombre: string;
  categoria_padre_id: string | null;
}

export interface GrupoDeCategorias<C extends CategoriaJerarquica> {
  raiz: C;
  /** La raíz misma coincide (o no hay búsqueda): se ofrece elegirla como "General". */
  raizCoincide: boolean;
  hijas: C[];
}

export function filtrarCategoriasJerarquicas<C extends CategoriaJerarquica>(
  categorias: readonly C[],
  consulta: string
): GrupoDeCategorias<C>[] {
  const palabras = normalizarTexto(consulta).split(/\s+/).filter(Boolean);
  const coincide = (texto: string) => {
    const t = normalizarTexto(texto);
    return palabras.every((p) => t.includes(p));
  };

  const grupos: GrupoDeCategorias<C>[] = [];
  const grupoPorRaiz = new Map<string, GrupoDeCategorias<C>>();
  for (const c of categorias) {
    if (c.categoria_padre_id) continue;
    const grupo: GrupoDeCategorias<C> = { raiz: c, raizCoincide: coincide(c.nombre), hijas: [] };
    grupos.push(grupo);
    grupoPorRaiz.set(c.id, grupo);
  }

  for (const c of categorias) {
    if (!c.categoria_padre_id) continue;
    // Una hija cuyo padre no vino en la lista (p. ej. un padre desactivado) no
    // tiene bajo qué dibujarse. Al 2026-10-15 no había ninguna en el catálogo.
    const grupo = grupoPorRaiz.get(c.categoria_padre_id);
    if (!grupo) continue;
    if (coincide(`${grupo.raiz.nombre} ${c.nombre}`)) grupo.hijas.push(c);
  }

  return grupos.filter((g) => g.raizCoincide || g.hijas.length > 0);
}
