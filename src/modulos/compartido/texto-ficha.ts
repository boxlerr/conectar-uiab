/**
 * Normalizaciones de texto de la ficha del directorio.
 *
 * Vive fuera de `/empresas/[slug]/page.tsx` porque ahora hay dos pantallas que
 * tienen que mostrar el MISMO texto con el MISMO formato: la ficha pública y el
 * preview "Tu ficha en el directorio" del panel de control. Si el panel se
 * hiciera su propia versión, el día que una de las dos cambie el preview
 * empieza a mentir sobre lo que ve la gente — que es exactamente lo que el
 * preview existe para evitar.
 *
 * Puro y sin dependencias: lo importan un Server Component y un Client
 * Component por igual.
 */

/**
 * Baja a minúsculas una descripción escrita toda en mayúsculas.
 *
 * 45 de las 59 descripciones están escritas íntegramente en MAYÚSCULAS
 * ("FABRICACION DE ENVASES PLASTICOS"): es cómo se cargó el padrón, no una
 * decisión de estilo, y así salía tanto en la ficha como en la meta description
 * que ve Google.
 *
 * Se normaliza al RENDERIZAR y no en la base, para no pisar lo que la socia
 * escriba después desde /perfil/datos. Sólo se toca si el texto es
 * mayoritariamente mayúsculas — así una descripción normal con siglas (ERP,
 * PVC, ISO) queda intacta.
 */
export function normalizarMayusculas(t: string): string {
  const letras = t.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]/g, "");
  if (letras.length < 8) return t;
  const mayus = (t.match(/[A-ZÁÉÍÓÚÑÜ]/g) || []).length;
  if (mayus / letras.length < 0.8) return t;
  const minus = t.toLocaleLowerCase("es");
  return minus.charAt(0).toLocaleUpperCase("es") + minus.slice(1);
}

/**
 * El texto que la ficha muestra en "Sobre la empresa".
 *
 * `descripcion` es lo que la socia escribió; `actividad` es lo que vino del
 * padrón. La regla —descripción propia primero, actividad como respaldo— es la
 * misma que usa el directorio, y equivocarla deja fichas en blanco: hay socias
 * que sólo tienen `actividad`.
 */
export function textoDeFicha(entidad: {
  descripcion?: string | null;
  actividad?: string | null;
}): string | null {
  const crudo = (entidad?.descripcion || entidad?.actividad || "").trim();
  // El umbral es 2 y no 8: con 8, una actividad como "QUIMICA" hacía
  // desaparecer la sección entera.
  return crudo.length > 2 ? normalizarMayusculas(crudo) : null;
}
