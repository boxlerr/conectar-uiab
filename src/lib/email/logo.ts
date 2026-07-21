/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LOGO PARA CORREOS — PNG embebido en base64
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Por qué base64 acá y no un import del filesystem:
 *   - Los clientes de correo NO renderizan SVG, así que los logos de `public/`
 *     (todos .svg salvo rasters gigantes) no sirven tal cual.
 *   - El PNG se adjunta *inline* (Content-ID) en vez de linkearse por URL:
 *     Outlook de escritorio bloquea las imágenes remotas por defecto, y con eso
 *     el encabezado del correo llegaba vacío. Un adjunto inline siempre pinta.
 *   - Se guarda como string y no como lectura de `public/email/*.png` porque en
 *     las funciones serverless de Vercel el filesystem de `public/` no está
 *     garantizado en runtime.
 *
 *  El mismo archivo vive en `public/email/logo-uiab-conecta.png` para las
 *  plantillas de Supabase Auth, que se editan en el Dashboard y sólo pueden
 *  referenciar una URL pública (ver docs/EMAIL_SETUP.md).
 *
 *  Fuente: `public/logo-uiab-conecta-completo.svg` → PNG 520×81 (se muestra a
 *  260px, 2x para pantallas retina), fondo blanco aplanado.
 */

/** Content-ID con el que se referencia el logo desde el HTML: `<img src="cid:...">`. */
export const LOGO_CID = "logo-uiab-conecta";

/** Ancho/alto de presentación en el correo (la imagen es el doble, para retina). */
export const LOGO_ANCHO = 260;
export const LOGO_ALTO = 40;

/** PNG del lockup «UIAB | Conecta» en color, sobre fondo blanco. */
export const LOGO_PNG_BASE64 =
  "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";
