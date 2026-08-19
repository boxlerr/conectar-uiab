/**
 * Adjuntos de una oportunidad — imágenes y documentos que la socia sube al
 * publicar (planos, especificaciones, fotos del estado actual).
 *
 * DÓNDE VIVEN Y POR QUÉ NO HAY TABLA
 *
 * Los archivos van al bucket público `oportunidades` bajo `<oportunidadId>/…`,
 * y la lista se lee directo de Storage (`storage.list()`), igual que el legajo
 * de /perfil/documentos. No hay tabla satélite tipo `imagenes_item` a propósito:
 * el nombre del objeto ya codifica orden y nombre original, y Storage devuelve
 * tamaño y MIME en los metadatos — una tabla duplicaría eso y sumaría una
 * migración más al drift que ya arrastra el esquema.
 *
 * CÓMO SE SUBE (el único flujo que no pasa el archivo por un action)
 *
 * El browser NO puede escribir en el bucket con la publishable key (no hay
 * policies para esta carpeta) y un Server Action tampoco puede recibir el
 * archivo (el body en Vercel corta en 4.5 MB, y un plano PDF los pasa). El
 * camino es: un action con guard de dueño firma URLs de subida
 * (`createSignedUploadUrl`, service role) y el browser sube directo a Storage
 * con `uploadToSignedUrl`. El token sólo sirve para esa ruta puntual, así que
 * nadie puede escribir fuera de su propia oportunidad.
 *
 * Los límites de este archivo se validan en el cliente y en el action, pero el
 * tope REAL lo pone el bucket: 10 MB y la whitelist de MIME están configurados
 * a nivel bucket (a diferencia de `imagenes-publicas`, que no limita nada).
 */

/** Bucket público dedicado. Público porque el detalle de una oportunidad
 *  abierta es una página indexable: sus imágenes se sirven sin sesión. */
export const BUCKET_ADJUNTOS = "oportunidades";

/** Tope de archivos por oportunidad (imágenes + documentos). */
export const MAX_ADJUNTOS = 8;

/** 6 MB por imagen — mismo tope que las imágenes de productos/servicios. */
export const MAX_IMAGEN_BYTES = 6 * 1024 * 1024;

/** 10 MB por documento — mismo tope que certificaciones y legajo, y el
 *  `file_size_limit` configurado en el bucket. */
export const MAX_DOCUMENTO_BYTES = 10 * 1024 * 1024;

/** MIME aceptados. Tienen que ser subconjunto del `allowed_mime_types` del
 *  bucket: lo que no esté acá rebota igual en Storage, pero con peor mensaje. */
export const MIME_IMAGENES = ["image/jpeg", "image/png", "image/webp"] as const;

export const MIME_DOCUMENTOS = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

/** Valor para el `accept` del input de archivos. */
export const ACCEPT_ADJUNTOS = [...MIME_IMAGENES, ...MIME_DOCUMENTOS].join(",");

export function esImagenAdjunto(mime: string | null | undefined): boolean {
  return Boolean(mime && (MIME_IMAGENES as readonly string[]).includes(mime));
}

/** Etiqueta corta del tipo de archivo para la lista de adjuntos (PDF, DOCX…). */
export function etiquetaDeTipo(mime: string | null | undefined, nombre?: string): string {
  switch (mime) {
    case "application/pdf":
      return "PDF";
    case "application/msword":
      return "DOC";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "DOCX";
    case "application/vnd.ms-excel":
      return "XLS";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "XLSX";
    case "image/jpeg":
      return "JPG";
    case "image/png":
      return "PNG";
    case "image/webp":
      return "WEBP";
  }
  // Sin MIME (listados viejos): cae a la extensión del nombre.
  const ext = nombre?.split(".").pop();
  return ext ? ext.toUpperCase().slice(0, 5) : "ARCHIVO";
}

export interface AdjuntoOportunidad {
  /** Ruta completa dentro del bucket: `<oportunidadId>/<objeto>`. */
  ruta: string;
  /** Nombre legible reconstruido del objeto (sin prefijo de orden). */
  nombre: string;
  /** URL pública del archivo. */
  url: string;
  mime: string | null;
  tamano: number | null;
  esImagen: boolean;
}

/** Lo que el cliente declara de cada archivo antes de pedir la URL firmada. */
export interface ArchivoDeclarado {
  nombre: string;
  mime: string;
  tamano: number;
}

/**
 * Valida un archivo (client-side antes de subir, server-side antes de firmar).
 * Devuelve el mensaje de error o `null` si pasa.
 */
export function validarAdjunto(archivo: ArchivoDeclarado): string | null {
  const esImagen = esImagenAdjunto(archivo.mime);
  const esDocumento = (MIME_DOCUMENTOS as readonly string[]).includes(archivo.mime);

  if (!esImagen && !esDocumento) {
    return `"${archivo.nombre}": formato no admitido. Aceptamos imágenes (JPG, PNG, WEBP), PDF, Word y Excel.`;
  }
  if (esImagen && archivo.tamano > MAX_IMAGEN_BYTES) {
    return `"${archivo.nombre}": las imágenes pueden pesar hasta 6 MB.`;
  }
  if (esDocumento && archivo.tamano > MAX_DOCUMENTO_BYTES) {
    return `"${archivo.nombre}": los documentos pueden pesar hasta 10 MB.`;
  }
  return null;
}

/** Mismo saneo de nombre que certificaciones y legajo. */
function nombreSeguro(nombre: string): string {
  return nombre.replace(/[^\w.\-]+/g, "_");
}

/**
 * Ruta del objeto: `<oportunidadId>/<NN>-<timestamp>-<nombre>`.
 * El prefijo `NN` mantiene el orden elegido al subir (el carrusel lo respeta) y
 * el timestamp hace la ruta única, que es lo que permite el `cacheControl`
 * de 31 días (misma convención que los logos: archivo nuevo = URL nueva).
 */
export function rutaParaAdjunto(
  oportunidadId: string,
  orden: number,
  nombreOriginal: string
): string {
  const nn = String(orden).padStart(2, "0");
  return `${oportunidadId}/${nn}-${Date.now()}-${nombreSeguro(nombreOriginal)}`;
}

/** Nombre legible a partir del nombre del objeto en Storage. */
export function nombreLegibleDeObjeto(objeto: string): string {
  const sinPrefijo = objeto.replace(/^\d{2}-\d{10,}-/, "");
  return sinPrefijo.replace(/_/g, " ");
}

/** URL pública de un adjunto. A mano por la misma razón que `urlPublicaDeLogo`:
 *  este módulo lo importan Server Components y componentes de browser. */
export function urlPublicaDeAdjunto(ruta: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !ruta) return null;
  const rutaSegura = ruta.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${BUCKET_ADJUNTOS}/${rutaSegura}`;
}

/** Peso legible: "1,2 MB" / "860 KB". */
export function tamanoLegible(bytes: number | null | undefined): string | null {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
