import { normalizarTexto } from "@/modulos/compartido/etiquetas";
import type { Entidad } from "./directorio";

/**
 * Búsqueda de texto del directorio (`directorio-cliente.tsx`, también la que
 * llega por `?q=` desde el cuadro de búsqueda de Google).
 *
 * Antes sólo se pasaba a minúsculas, así que "metalurgica" no encontraba
 * "Metalúrgica" ni "tornería" encontraba "Torneria": quien escribe rápido, o
 * desde el celular, casi nunca pone las tildes. Ahora se normaliza de los dos
 * lados, el término y cada campo, igual que el buscador de rubros
 * (`modulos/compartido/buscador-categorias.ts`).
 *
 * Sigue siendo una coincidencia de la frase entera dentro de algún campo, como
 * antes: no se separa por palabras.
 */
export type CamposBuscablesDeEntidad = Pick<
  Entidad,
  "nombre" | "categoria" | "descripcionCorta" | "ubicacion" | "servicios" | "tags" | "certificaciones"
>;

export function entidadCoincideConBusqueda(
  entidad: CamposBuscablesDeEntidad,
  busqueda: string
): boolean {
  const termino = normalizarTexto(busqueda.trim());
  if (termino === "") return true;

  return [
    entidad.nombre,
    entidad.categoria,
    entidad.descripcionCorta,
    entidad.ubicacion,
    ...entidad.servicios,
    ...entidad.tags,
    ...(entidad.certificaciones ?? []).map((c) => c.etiqueta),
  ].some((campo) => normalizarTexto(campo).includes(termino));
}
