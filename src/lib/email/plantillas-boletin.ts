/**
 * Plantilla del aviso del Boletín UIAB: el correo que le llega a cada socia
 * cuando la UIAB publica una nota.
 *
 * ES UN ADELANTO, NO LA NOTA ENTERA. El boletín es público desde que salió del
 * login, así que la nota completa ya vive en una URL que se abre sin cuenta: el
 * correo manda un extracto y un botón. Mandar el cuerpo entero por mail haría
 * el trabajo dos veces, rompería en Outlook cuanto más largo fuera, y dejaría
 * sin medir si la nota se lee.
 *
 * Vive acá y no en `src/modulos/boletin/` porque no sabe nada de comunicados:
 * recibe strings ya resueltos (título, extracto, URL, fecha). Quien arma esos
 * strings es `modulos/boletin/aviso.ts`, que sí conoce el dominio.
 */

import { renderEmailBase, escapeText, escapeTextoMultilinea } from "./plantillas";

/** Los mismos tokens de `plantillas.ts`, que no los exporta. Si cambian allá, cambian acá. */
const COLOR = {
  primary: "#00213f",
  onSurface: "#191c1e",
  onSurfaceMuted: "#525b63",
  surfaceDim: "#d8dadc",
} as const;

const FONT_BODY = "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Ancho útil del correo: 600 de la tabla menos los 32 de padding de cada lado. */
const ANCHO_UTIL = 536;

export interface DatosBoletinNuevo {
  /** Título de la nota. Vacío si la publicación no lleva (un aviso corto, una foto). */
  titulo: string;
  /** Bajada de la nota. Vacía si no tiene. */
  bajada: string;
  /** Extracto del cuerpo, ya sin las marcas `## ` y ya recortado. */
  extracto: string;
  /** ¿El extracto se cortó? Cambia el texto del botón ("Leer la nota" vs "Ver la publicación"). */
  hayMas: boolean;
  /** URL absoluta y canónica de la nota (la de `/e/`-style: slug + sufijo de id). */
  url: string;
  /** Foto de portada, si la hay. URL pública del bucket. */
  imagenUrl: string | null;
  /** "22 de septiembre de 2026". */
  fecha: string;
}

/**
 * La portada, como imagen remota.
 *
 * Va por URL y no adjunta como el logo: una foto de evento pesa cientos de KB y
 * adjuntarla en 103 correos es mandar decenas de megas por una imagen
 * decorativa. Outlook de escritorio la va a bloquear hasta que el socio toque
 * "Descargar imágenes" — y está bien que así sea: a diferencia del logo, si la
 * foto no se pinta no falta nada. Por eso el `alt` describe la nota y el correo
 * se entiende entero sin ella.
 */
function portada(src: string, href: string, alt: string): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 20px 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
      <tr>
        <td>
          <a href="${escapeText(href)}" style="text-decoration: none;">
            <img src="${escapeText(src)}" width="${ANCHO_UTIL}" alt="${escapeText(
              alt
            )}" style="display: block; width: 100%; max-width: ${ANCHO_UTIL}px; height: auto; border: 0; outline: none; text-decoration: none; font-family: ${FONT_BODY}; font-size: 13px; line-height: 1.5; color: ${
              COLOR.onSurfaceMuted
            };" border="0" />
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * El aviso de una publicación nueva del Boletín.
 *
 * `imagenUrl` tiene que ser la URL de la portada **y también** el `href` al que
 * apunta: la foto es clickeable, porque en un correo con foto grande mucha
 * gente toca la imagen antes que el botón.
 */
export function plantillaBoletinNuevo(d: DatosBoletinNuevo): {
  asunto: string;
  html: string;
  texto: string;
} {
  const titulo = d.titulo.trim();
  const bajada = d.bajada.trim();
  const extracto = d.extracto.trim();

  // Una publicación puede no tener título (un aviso de dos líneas, una foto de
  // un evento). El <h1> del correo no puede quedar vacío, así que en ese caso
  // el encabezado lo pone el boletín y el texto de la nota queda como cuerpo.
  const encabezado = titulo || "Nueva publicación en el Boletín";

  // El asunto es lo único que decide si el correo se abre. Con título, el
  // título; sin título, la primera línea de lo que se escribió, que es más
  // informativa que un "Nueva publicación" repetido cada vez.
  const asuntoBase = titulo || bajada || extracto.split("\n")[0] || "Nueva publicación";
  const asunto = `${asuntoBase.length > 90 ? `${asuntoBase.slice(0, 90).replace(/\s+\S*$/, "")}…` : asuntoBase} — Boletín UIAB`;

  const bloqueBajada = bajada
    ? `<p style="margin: 0 0 16px 0; font-family: ${FONT_BODY}; font-size: 16px; line-height: 1.6; font-weight: 700; color: ${COLOR.onSurface};">${escapeTextoMultilinea(
        bajada
      )}</p>`
    : "";

  const bloqueExtracto = extracto
    ? `<p style="margin: 0 0 8px 0; font-family: ${FONT_BODY}; font-size: 15px; line-height: 1.65; color: ${COLOR.onSurface};">${escapeTextoMultilinea(
        extracto
      )}${d.hayMas ? "…" : ""}</p>`
    : "";

  const cuerpo = `
    ${d.imagenUrl ? portada(d.imagenUrl, d.url, titulo || "Foto de la publicación") : ""}
    ${bloqueBajada}
    ${bloqueExtracto}
    ${
      // Una publicación que es sólo una foto no tiene ni bajada ni texto: sin
      // esta línea el correo llegaría con el encabezado y nada más.
      !bloqueBajada && !bloqueExtracto
        ? `<p style="margin: 0 0 8px 0; font-family: ${FONT_BODY}; font-size: 15px; line-height: 1.65; color: ${COLOR.onSurface};">La UIAB publicó algo nuevo en el boletín.</p>`
        : ""
    }
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0 0 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
      <tr><td height="1" bgcolor="${COLOR.surfaceDim}" style="height: 1px; line-height: 1px; font-size: 1px; background-color: ${COLOR.surfaceDim};">&nbsp;</td></tr>
    </table>
    <p style="margin: 12px 0 0 0; font-family: ${FONT_BODY}; font-size: 12px; line-height: 1.6; color: ${COLOR.onSurfaceMuted};">Boletín UIAB · ${escapeText(
      d.fecha
    )}</p>
  `;

  return {
    asunto,
    html: renderEmailBase({
      preheader: bajada || extracto.slice(0, 140) || "La UIAB publicó algo nuevo en el boletín.",
      titulo: encabezado,
      intro: `Nueva publicación en el Boletín de la UIAB — ${d.fecha}.`,
      cuerpo,
      cta: { etiqueta: d.hayMas ? "Leer la nota completa" : "Ver la publicación", href: d.url },
      pie: "Recibís este correo porque tu empresa figura como socia en el padrón de la UIAB. Si preferís no recibir los avisos del boletín, respondé este mensaje y te damos de baja de la lista.",
    }),
    // Los bloques se unen con renglón en blanco. Se arma filtrando ANTES de
    // unir —y no con un `.filter` sobre el resultado— porque filtrar cadenas
    // vacías después se comería justamente los renglones que separan párrafos.
    texto: [
      `${encabezado}\nBoletín UIAB — ${d.fecha}`,
      bajada,
      extracto ? `${extracto}${d.hayMas ? "…" : ""}` : "",
      `${d.hayMas ? "Leer la nota completa:" : "Ver la publicación:"}\n${d.url}`,
      "Recibís este correo porque tu empresa figura como socia en el padrón de la UIAB. Si preferís no recibir los avisos del boletín, respondé este mensaje y te damos de baja.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}
