/**
 * La descripción de una oportunidad se guarda como HTML: la escribe un editor
 * `contentEditable` y el detalle la renderiza con `dangerouslySetInnerHTML`.
 *
 * En cualquier otro lado —la cartelera, la landing pública, el `<meta
 * description>`, el buscador— hay que aplanarla primero. Sin esto la tarjeta
 * del listado mostraba literalmente `<p>Necesitamos <strong>cableado…` y el
 * buscador daba resultados por palabras que nadie escribió, como "strong".
 */

/** Entidades que aparecen de verdad en lo que genera el editor. */
const ENTIDADES: [RegExp, string][] = [
  [/&nbsp;/g, " "],
  [/&amp;/g, "&"],
  [/&lt;/g, "<"],
  [/&gt;/g, ">"],
  [/&quot;/g, '"'],
  [/&#39;/g, "'"],
];

/** HTML → texto legible, con los espacios normalizados. */
export function textoPlanoDeHtml(html: string | null | undefined): string {
  if (!html) return "";
  let texto = html.replace(/<[^>]*>/g, " ");
  for (const [patron, reemplazo] of ENTIDADES) texto = texto.replace(patron, reemplazo);
  return texto.replace(/\s+/g, " ").trim();
}

/** Recorta sin partir una palabra al medio ("…patchera" y no "…patch"). */
export function recortarEnPalabra(texto: string, maximo: number): string {
  if (texto.length <= maximo) return texto;
  const cortado = texto.slice(0, maximo);
  const ultimoEspacio = cortado.lastIndexOf(" ");
  const base = ultimoEspacio > maximo * 0.6 ? cortado.slice(0, ultimoEspacio) : cortado;
  // Sin el saneo, un corte justo después de una coma queda como "24 bocas,…".
  return `${base.replace(/[\s,;:.\-–—]+$/, "")}…`;
}
