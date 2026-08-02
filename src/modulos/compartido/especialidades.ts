/**
 * Especialidades libres: los rubros que el socio escribe a mano en
 * /perfil/servicios cuando el catálogo oficial no lo representa.
 *
 * Comparte las primitivas de texto con las etiquetas libres (mismo problema:
 * deduplicar contra un catálogo curado), pero los límites y los mensajes son
 * propios: un rubro es más largo que una etiqueta ("Recipientes y Tuberías a
 * Presión" son 5 palabras y 32 caracteres, y es una entrada oficial).
 */

import { normalizarTexto, slugEtiqueta } from "./etiquetas";

export const ESPECIALIDAD_MIN = 3;
export const ESPECIALIDAD_MAX = 60;
export const ESPECIALIDAD_MAX_PALABRAS = 8;

/** Letras (con tildes y ñ), números, espacios y la puntuación del catálogo. */
const CARACTERES_VALIDOS = /^[\p{L}\p{N} .,&/\-+°()]+$/u;

/** Slug canónico de una especialidad. Mismo criterio que el de etiquetas. */
export function slugEspecialidad(texto: string): string {
  return slugEtiqueta(texto);
}

/** Trim + colapsar espacios internos. No toca mayúsculas ni tildes. */
export function limpiarNombreEspecialidad(texto: string): string {
  return texto.replace(/\s+/g, " ").trim();
}

/**
 * Valida el texto que escribió el socio. Devuelve el mensaje de error, o `null`
 * si está todo bien. Se usa igual en el cliente (feedback inmediato) y en el
 * servidor (que es el que manda).
 */
export function validarEspecialidadLibre(texto: string): string | null {
  const nombre = limpiarNombreEspecialidad(texto);

  if (nombre.length < ESPECIALIDAD_MIN) {
    return `La especialidad es muy corta. Escribí al menos ${ESPECIALIDAD_MIN} caracteres.`;
  }
  if (nombre.length > ESPECIALIDAD_MAX) {
    return `La especialidad no puede tener más de ${ESPECIALIDAD_MAX} caracteres. Probá con algo más concreto.`;
  }
  if (!CARACTERES_VALIDOS.test(nombre)) {
    return "Usá sólo letras, números y espacios. Nada de emojis ni símbolos raros.";
  }
  if (nombre.split(" ").length > ESPECIALIDAD_MAX_PALABRAS) {
    return "Una especialidad es un rubro, no una descripción. Probá con menos palabras.";
  }
  if (!slugEspecialidad(nombre)) {
    return "Ese texto no sirve como especialidad. Escribí el nombre del rubro.";
  }
  return null;
}

/** Para comparar lo tipeado contra el catálogo sin importar tildes ni mayúsculas. */
export { normalizarTexto };
