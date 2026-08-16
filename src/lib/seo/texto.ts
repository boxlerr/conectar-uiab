/**
 * Recortes de texto para metadata.
 *
 * Google trunca los <title> alrededor de los 60-65 caracteres y las
 * descriptions alrededor de los 155-160. Truncar acá, con criterio propio, es
 * mejor que dejar que Google corte donde caiga: el corte respeta el límite de
 * palabra y decide qué parte sacrificar (el contexto, nunca el nombre).
 */

/** Presupuesto del title SIN el sufijo: " | UIAB Conecta" son 15 caracteres
 *  que agrega el template del layout raíz, y 50 + 15 = 65. */
export const TOPE_TITLE_SIN_SUFIJO = 50;

/**
 * Corta al último límite de palabra que entra en `max`, con elipsis.
 * Si ya entra, devuelve tal cual.
 */
export function cortarEnPalabra(texto: string, max = 158): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  return limpio.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

/**
 * Title de una ficha de /empresas/[slug], con tope.
 *
 * La fórmula `nombre — categoría en localidad` ya se pasó de largo DOS veces
 * (77 caracteres la primera, ~100 la segunda: hay socias con razón social
 * larga Y categoría larga). En vez de una fórmula fija, una cadena de
 * candidatos de más contexto a menos: gana el primero que entra en el
 * presupuesto. El nombre no se recorta nunca — si ni solo entra, sale entero
 * igual y Google truncará: recortar la razón social de una socia real es peor
 * que un title largo.
 */
export function tituloDeFicha(d: {
  nombre: string;
  categoria?: string | null;
  localidad?: string | null;
  rol: string;
}): string {
  const candidatos = [
    d.categoria && d.localidad ? `${d.nombre} — ${d.categoria} en ${d.localidad}` : null,
    d.categoria ? `${d.nombre} — ${d.categoria}` : null,
    d.localidad ? `${d.nombre} — ${d.localidad}` : null,
    `${d.nombre} — ${d.rol}`,
  ].filter((c): c is string => Boolean(c));

  return candidatos.find((c) => c.length <= TOPE_TITLE_SIN_SUFIJO) ?? d.nombre;
}
