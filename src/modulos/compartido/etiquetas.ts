/**
 * Vocabulario compartido de etiquetas (tabla `tags`).
 *
 * El `tipo_tag` que viene de la base es un slug interno; acá vive su rótulo
 * visible y el orden en el que se muestran los grupos. Cualquier pantalla que
 * agrupe etiquetas debería importar de acá en vez de redeclarar el mapa.
 */

export interface TagOption {
  id: string;
  nombre: string;
  tipo_tag: string;
}

export const TIPO_TAG_LABELS: Record<string, string> = {
  problema: "Necesidad que resuelvo",
  capacidad: "Servicios",
  material: "Materiales",
  industria: "Industria",
  modalidad_servicio: "Modalidad",
  general: "General",
  ubicacion: "Ubicación",
};

export const TIPO_TAG_ORDEN: readonly string[] = [
  "problema",
  "capacidad",
  "material",
  "industria",
  "modalidad_servicio",
  "general",
  "ubicacion",
];

/** Minúsculas y sin tildes, para que "Fundición" matchee tipeando "fundicion". */
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ─── Etiquetas libres (las que escribe el socio) ─────────────────────────────

/**
 * Slug canónico de una etiqueta, para deduplicar contra el catálogo.
 *
 * Difiere de `crearSlug` (lib/utilidades) en que trata la puntuación como
 * separador en vez de borrarla: el catálogo tiene "24/7" guardado como `24-7`,
 * y `crearSlug` lo convertiría en `247`, creando un duplicado de una oficial.
 * No se toca `crearSlug` porque lo usan empresas y categorías.
 */
export function slugEtiqueta(texto: string): string {
  return normalizarTexto(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Trim + colapsar espacios internos. No toca mayúsculas ni tildes. */
export function limpiarNombreEtiqueta(texto: string): string {
  return texto.replace(/\s+/g, " ").trim();
}

export const ETIQUETA_MIN = 3;
export const ETIQUETA_MAX = 40;
export const ETIQUETA_MAX_PALABRAS = 5;
/** Cupo de etiquetas propias por socio. Las del catálogo oficial no cuentan. */
export const MAX_ETIQUETAS_LIBRES = 10;
/** Etiquetas nuevas (no reutilizadas) que un socio puede crear por día. */
export const MAX_ETIQUETAS_LIBRES_POR_DIA = 5;

/** Letras (con tildes y ñ), números, espacios y la puntuación que aparece en el catálogo. */
const CARACTERES_VALIDOS = /^[\p{L}\p{N} .,&/\-+°()]+$/u;

/**
 * Valida el texto que escribió el socio. Devuelve el mensaje de error, o `null`
 * si está todo bien. Se usa igual en el cliente (feedback inmediato) y en el
 * servidor (que es el que manda).
 */
export function validarEtiquetaLibre(texto: string): string | null {
  const nombre = limpiarNombreEtiqueta(texto);

  if (nombre.length < ETIQUETA_MIN) {
    return `La etiqueta es muy corta. Escribí al menos ${ETIQUETA_MIN} caracteres.`;
  }
  if (nombre.length > ETIQUETA_MAX) {
    return `La etiqueta no puede tener más de ${ETIQUETA_MAX} caracteres. Probá con algo más corto y concreto.`;
  }
  if (!CARACTERES_VALIDOS.test(nombre)) {
    return "Usá sólo letras, números y espacios. Nada de emojis ni símbolos raros.";
  }
  if (nombre.split(" ").length > ETIQUETA_MAX_PALABRAS) {
    return "Una etiqueta es una palabra o frase corta, no una descripción. Probá con menos palabras.";
  }
  if (!slugEtiqueta(nombre)) {
    return "Ese texto no sirve como etiqueta. Escribí una palabra o frase corta.";
  }
  return null;
}
