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
  /** El párrafo destacado bajo el título. Vacía = la nota no lleva bajada. */
  bajada: string;
  cuerpo: string;
  bucket: string | null;
  /** Rutas de las fotos dentro de `bucket`, en orden. La primera es la portada. */
  rutas_imagenes: string[];
  estado: EstadoComunicado;
  fijado: boolean;
  publicado_en: string | null;
  creado_por: string | null;
  creado_en: string;
  actualizado_en: string;
};

/**
 * Una fila con lo que además necesita el PANEL: el estado del aviso por email.
 *
 * Son tres columnas más de `comunicados`, pero no van en `Comunicado` porque
 * `ComunicadoPublico` lo extiende, y ése viaja al browser en /boletin, que lee
 * cualquiera sin cuenta. A un visitante no le incumbe a cuántas socias se le
 * mandó la nota ni cuándo: lo ve sólo quien entra a /admin.
 */
export type ComunicadoAdmin = Comunicado & {
  /** ¿Avisar por email al publicarla? Se tilda en el compositor. */
  avisar_por_email: boolean;
  /** Cuándo salió el aviso. Null = todavía no salió (y puede salir). */
  aviso_enviado_en: string | null;
  /** A cuántas casillas se mandó. Null si nunca se mandó o si se cortó a mitad. */
  aviso_destinatarios: number | null;
};

/**
 * Lo que el panel manda al crear o editar. La foto ya se subió a Storage desde
 * el browser (mismo flujo que los logos): acá viajan sólo `bucket` + `ruta` para
 * guardarlos, no el archivo.
 */
export type DatosComunicado = {
  titulo: string;
  bajada: string;
  cuerpo: string;
  estado: EstadoComunicado;
  fijado: boolean;
  bucket: string | null;
  rutas_imagenes: string[];
  /**
   * ¿Avisar por email a las socias cuando se publique?
   *
   * Es la INTENCIÓN, no la orden de mandar: se guarda en la fila y el aviso
   * sale cuando la nota efectivamente pase a `publicado`, una sola vez. Guardar
   * un borrador con esto en `true` no manda nada.
   */
  avisar_por_email: boolean;
};

/**
 * Un comunicado listo para mostrar: las fotos ya resueltas a URL pública.
 *
 * `imagenUrl` es la PORTADA y se deriva de `imagenes[0]` en un solo lugar
 * (`conImagen`, en consultas.ts). Existe porque hay pantallas que muestran una
 * sola foto —la tira del panel, la tarjeta de "Más novedades", la imagen de
 * OpenGraph— y no tiene sentido que cada una repita `imagenes[0] ?? null`.
 */
export type ComunicadoPublico = Comunicado & {
  imagenes: string[];
  imagenUrl: string | null;
};

/** Bucket público donde vive la foto del comunicado (el mismo que logos/imágenes). */
export const BUCKET_BOLETIN = "imagenes-publicas";

/** Carpeta dentro del bucket. */
export const CARPETA_BOLETIN = "boletin";

/**
 * Tope de fotos por publicación. No es una restricción técnica: es que un
 * carrusel de más de 10 no lo mira nadie, y cada foto es una descarga más para
 * la socia que abre el boletín desde el celular.
 */
export const MAX_FOTOS = 10;

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
