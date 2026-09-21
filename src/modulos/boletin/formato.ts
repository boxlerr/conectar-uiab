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

/** Ruta de la página de un comunicado. */
export function rutaComunicado(id: string): string {
  return `/boletin/${id}`;
}
