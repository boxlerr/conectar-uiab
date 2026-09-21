/**
 * Tipos del Boletín UIAB. Viven fuera de `acciones.ts` porque ese archivo es
 * `"use server"` y desde ahí sólo pueden exportarse funciones async: un `type`
 * exportado desde una server action rompe el build.
 */

export type EstadoComunicado = "borrador" | "publicado";

/** Una fila de `public.comunicados`, tal como vuelve de la base. */
export type Comunicado = {
  id: string;
  titulo: string;
  cuerpo: string;
  bucket: string | null;
  ruta_imagen: string | null;
  estado: EstadoComunicado;
  fijado: boolean;
  publicado_en: string | null;
  creado_por: string | null;
  creado_en: string;
  actualizado_en: string;
};

/**
 * Lo que el panel manda al crear o editar. La foto ya se subió a Storage desde
 * el browser (mismo flujo que los logos): acá viajan sólo `bucket` + `ruta` para
 * guardarlos, no el archivo.
 */
export type DatosComunicado = {
  titulo: string;
  cuerpo: string;
  estado: EstadoComunicado;
  fijado: boolean;
  bucket: string | null;
  ruta_imagen: string | null;
};

/** Un comunicado ya listo para mostrar: la foto resuelta a URL pública. */
export type ComunicadoPublico = Comunicado & { imagenUrl: string | null };

/** Bucket público donde vive la foto del comunicado (el mismo que logos/imágenes). */
export const BUCKET_BOLETIN = "imagenes-publicas";

/** Carpeta dentro del bucket. */
export const CARPETA_BOLETIN = "boletin";

/**
 * Formatos de foto aceptados y la extensión con la que se guardan. La
 * extensión sale de acá y no del nombre del archivo: la ruta la arma el
 * servidor al firmar la subida.
 */
export const EXTENSION_POR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
