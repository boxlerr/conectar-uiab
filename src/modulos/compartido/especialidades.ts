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

// ─── Normalización para el catálogo ──────────────────────────────────────────

/**
 * Conectores que van en minúscula adentro de un nombre de rubro.
 * "Alquiler de Andamios", no "Alquiler De Andamios".
 */
const CONECTORES = new Set([
  "a", "al", "ante", "bajo", "con", "contra", "de", "del", "desde", "e", "el",
  "en", "entre", "hacia", "hasta", "la", "las", "lo", "los", "o", "para", "por",
  "según", "sin", "sobre", "tras", "u", "un", "una", "y",
]);

/**
 * Saca la puntuación que quedó pegada al final ("...uso industrial.").
 *
 * No toca las siglas: si al borrar el punto la última palabra todavía tiene
 * otro punto, ese punto era parte del nombre ("E.P.P.").
 */
function quitarPuntuacionFinal(texto: string): string {
  let salida = texto;
  while (/[.,;:]$/.test(salida)) {
    const recortado = salida.slice(0, -1).trimEnd();
    if (!recortado) break;
    const ultimaPalabra = recortado.split(" ").pop() ?? "";
    if (salida.endsWith(".") && ultimaPalabra.includes(".")) break;
    salida = recortado;
  }
  return salida;
}

/**
 * Capitaliza una palabra suelta.
 *
 * Si el token ya trae alguna mayúscula propia se respeta tal cual: es una sigla
 * o una marca que alguien escribió a propósito ("CNC", "Instrumental/PLC",
 * "Depósitos/3PL"). Los separadores internos arrancan palabra, así que
 * "corte/plegado" sale "Corte/Plegado".
 */
function capitalizarToken(token: string, esPrimero: boolean): string {
  if (!token) return token;
  if (/\p{Lu}/u.test(token)) return token;
  if (!esPrimero && CONECTORES.has(token)) return token;
  return token.replace(
    /(^|[/\-–(])(\p{Ll})/gu,
    (_, separador: string, letra: string) => separador + letra.toUpperCase()
  );
}

/**
 * Nombre canónico de un servicio del catálogo.
 *
 * Los socios escriben sus rubros como les sale ("alquiler autoelevador",
 * "Fabricación de resinas y gelcoat para uso industrial."), y hasta ahora eso
 * entraba al catálogo oficial tal cual, al lado de entradas curadas. Esta
 * función es la que se aplica cuando un nombre pasa a ser público.
 *
 * Lo que NO hace, a propósito:
 *  - No toca los nombres en MAYÚSCULAS: es la convención de los macro-rubros
 *    ("METALMECÁNICA Y METALURGIA"), no un descuido.
 *  - No inventa tildes. "fabricacion" sale "Fabricacion"; corregirlo es
 *    decisión del admin, que puede editar el nombre antes de promoverlo.
 *
 * Es idempotente: aplicarla dos veces da lo mismo que una.
 */
export function normalizarNombreServicio(texto: string | null | undefined): string {
  const limpio = limpiarNombreEspecialidad(texto ?? "");
  if (!limpio) return "";

  const sinPuntuacion = quitarPuntuacionFinal(limpio);

  // Sin una sola minúscula = macro-rubro escrito en caja alta. Se deja.
  if (!/\p{Ll}/u.test(sinPuntuacion)) return sinPuntuacion;

  return sinPuntuacion
    .split(" ")
    .map((token, i) => capitalizarToken(token, i === 0))
    .join(" ");
}

/** ¿El nombre ya está como lo guardaría el catálogo? */
export function estaNormalizado(texto: string | null | undefined): boolean {
  const original = (texto ?? "").trim();
  return original.length > 0 && original === normalizarNombreServicio(original);
}
