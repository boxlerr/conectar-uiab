import { crearSlug } from "@/lib/utilidades";

/** "21 de septiembre de 2026". Vacío si todavía no se publicó. */
export function fechaLegible(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * "Recién" / "12 min" / "22 h" / "3 d" / "21 sept": el formato corto de las
 * redes, para el encabezado de cada publicación. Pasada la semana, la fecha.
 */
export function tiempoCorto(iso: string | null): string {
  if (!iso) return "";
  const min = Math.floor((Date.now() - Date.parse(iso)) / 60_000);
  if (min < 1) return "Recién";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d`;
  const fecha = new Date(iso);
  const mismoAnio = fecha.getFullYear() === new Date().getFullYear();
  return fecha.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    ...(mismoAnio ? {} : { year: "numeric" }),
  });
}

/**
 * Cómo nombrar una publicación donde hace falta una línea (la lista del panel
 * de admin, el <title>, el diálogo de borrar). El título es opcional —una
 * publicación puede ser sólo texto, o sólo una foto—, así que cae a la primera
 * línea del texto.
 */
export function resumenComunicado(c: { titulo: string; cuerpo: string }): string {
  const titulo = c.titulo.trim();
  if (titulo) return titulo;
  const primeraLinea = c.cuerpo.trim().split("\n")[0]?.trim() ?? "";
  if (!primeraLinea) return "Publicación con foto";
  return primeraLinea.length > 80 ? `${primeraLinea.slice(0, 80).trimEnd()}…` : primeraLinea;
}

/* ── URLs ──────────────────────────────────────────────────────────────────
 *
 * La nota vive en /boletin/<titulo-en-slug>-<8 del id>, no en /boletin/<uuid>.
 * La URL es la primera línea que lee Google (y la que se pega por WhatsApp):
 * un uuid no dice nada de qué hay adentro.
 *
 * POR QUÉ EL SUFIJO Y NO UNA COLUMNA `slug`
 *
 * El slug se calcula del título, no se guarda. Con los 8 primeros caracteres
 * del uuid la URL es única sin unique index, sin backfill y sin migración, y
 * —lo que más importa— **el enlace viejo nunca muere**: para resolver alcanza
 * el sufijo, así que si mañana se corrige el título, la URL anterior sigue
 * encontrando la nota y redirige 301 a la nueva. Con una columna `slug` habría
 * que decidir a mano entre romper el enlace o dejar el slug desactualizado.
 *
 * Es el mismo patrón de Medium / dev.to. Si algún día se quiere la URL limpia
 * sin sufijo, ahí sí hace falta la columna (y manejar colisiones a mano).
 */

/** Los 8 caracteres del id que hacen única a la URL. */
const LARGO_SUFIJO = 8;

/** Tope del tramo legible: URLs más largas se recortan solas en los buscadores. */
const LARGO_SLUG = 70;

/** "asi-se-ve-una-nota-del-boletin-uiab-fab6bc0e" */
export function slugComunicado(c: { id: string; titulo: string; cuerpo: string }): string {
  const legible = crearSlug(resumenComunicado(c))
    .slice(0, LARGO_SLUG)
    .replace(/-+$/, "");
  // Una publicación que es sólo una foto (o sólo emojis) no deja nada legible.
  return `${legible || "novedad"}-${c.id.slice(0, LARGO_SUFIJO)}`;
}

/**
 * El tramo de id que trae una URL del boletín. Acepta las dos formas:
 * el slug nuevo (…-fab6bc0e) y el uuid pelado de los enlaces viejos.
 * Null si no parece ninguna de las dos.
 */
export function prefijoIdDeSlug(slug: string): string | null {
  const uuid = slug.match(/^[0-9a-f]{8}-[0-9a-f-]{27}$/i);
  if (uuid) return slug.slice(0, LARGO_SUFIJO).toLowerCase();
  const conSufijo = slug.match(new RegExp(`-([0-9a-f]{${LARGO_SUFIJO}})$`, "i"));
  return conSufijo ? conSufijo[1].toLowerCase() : null;
}

/** Ruta de la página de una publicación. */
export function rutaComunicado(c: { id: string; titulo: string; cuerpo: string }): string {
  return `/boletin/${slugComunicado(c)}`;
}

/* ── El cuerpo de la nota ──────────────────────────────────────────────────
 *
 * El texto es plano: una línea en blanco separa párrafos. La única marca es
 * `## ` al principio de una línea, que la convierte en SUBTÍTULO de sección.
 *
 * POR QUÉ UNA MARCA Y NO UN EDITOR ENRIQUECIDO. Una nota larga sin subtítulos
 * es un muro; con un editor de texto rico habría que guardar HTML, sanitizarlo
 * y arrastrar el problema que ya dio la descripción de las oportunidades. Una
 * marca de dos caracteres se guarda como texto, no ejecuta nada, y el panel
 * tiene un botón que la inserta, así que no hay que saber Markdown para usarla.
 */

export const MARCA_SUBTITULO = "## ";

export type BloqueCuerpo = { tipo: "subtitulo" | "parrafo"; texto: string };

/**
 * Parte el cuerpo en bloques para renderizar. Los párrafos se separan con una
 * línea en blanco; una línea suelta que arranca con `## ` es un subtítulo, y
 * corta el párrafo aunque no haya línea en blanco (si alguien escribe el
 * subtítulo pegado al texto de arriba, igual sale bien).
 */
export function bloquesDeCuerpo(cuerpo: string): BloqueCuerpo[] {
  const bloques: BloqueCuerpo[] = [];
  let parrafo: string[] = [];

  const cerrar = () => {
    const texto = parrafo.join("\n").trim();
    if (texto) bloques.push({ tipo: "parrafo", texto });
    parrafo = [];
  };

  for (const linea of cuerpo.split("\n")) {
    if (linea.trimStart().startsWith(MARCA_SUBTITULO)) {
      cerrar();
      const texto = linea.trimStart().slice(MARCA_SUBTITULO.length).trim();
      if (texto) bloques.push({ tipo: "subtitulo", texto });
      continue;
    }
    if (linea.trim() === "") {
      cerrar();
      continue;
    }
    parrafo.push(linea);
  }
  cerrar();
  return bloques;
}

/**
 * El cuerpo sin las marcas, para donde se muestra como texto corrido: el
 * adelanto de la tarjeta, el panel del visor, el `<meta description>`. Sin
 * esto, el resumen de una nota con subtítulos empieza con "## ".
 */
export function cuerpoSinMarcas(cuerpo: string): string {
  return cuerpo
    .split("\n")
    .map((l) => (l.trimStart().startsWith(MARCA_SUBTITULO) ? l.trimStart().slice(MARCA_SUBTITULO.length) : l))
    .join("\n");
}

/* ── Qué entra al índice de Google ─────────────────────────────────────────
 *
 * El boletín es público, pero no todo lo que se publica es una nota: hay avisos
 * de dos líneas y publicaciones que son sólo una foto. Indexar eso es fabricar
 * thin content — el problema que ya tiene el sitio con las fichas sin
 * descripción—, y unas cuantas URLs flacas le bajan la nota al dominio entero.
 *
 * Criterio: se indexa lo que tiene título y cuerpo de nota. El resto se lee y
 * se comparte igual (es público), pero va con `noindex, follow` y fuera del
 * sitemap. Cuando a un aviso se le agrega texto, entra solo.
 */

/** Mínimo de palabras para que una publicación sea una nota indexable. */
export const PALABRAS_PARA_INDEXAR = 40;

export function esNotaIndexable(c: { titulo: string; cuerpo: string }): boolean {
  if (!c.titulo.trim()) return false;
  return c.cuerpo.trim().split(/\s+/).filter(Boolean).length >= PALABRAS_PARA_INDEXAR;
}

/**
 * Lo que va al `<meta description>` y al OG. Usa la BAJADA si la nota tiene
 * —es literalmente el resumen que escribió la UIAB— y si no, el cuerpo.
 */
export function descripcionComunicado(c: { bajada?: string; cuerpo: string }, largo = 155): string {
  const fuente = c.bajada?.trim() || cuerpoSinMarcas(c.cuerpo);
  const plano = fuente.trim().replace(/\s+/g, " ");
  if (plano.length <= largo) return plano;
  return `${plano.slice(0, largo).replace(/\s+\S*$/, "")}…`;
}
