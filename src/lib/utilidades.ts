import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Pasa a texto plano una descripción guardada como HTML.
 *
 * Las descripciones de oportunidades se cargan en un editor enriquecido, o sea
 * que en la base viven como "<p>Necesitamos <b>500 kg</b>…</p>". Donde se las
 * muestra como HTML se ven bien; donde se las imprime como texto —la tarjeta
 * del listado— salían las etiquetas a la vista.
 *
 * No sanitiza: es sólo para MOSTRAR un resumen. Para renderizar el contenido
 * con formato hay que seguir usando el camino de siempre.
 */
export function aTextoPlano(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function crearSlug(texto: string) {
  return texto
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * Normaliza un tel\u00e9fono argentino a formato wa.me (solo d\u00edgitos, con pa\u00eds 54).
 * Devuelve null si no hay d\u00edgitos suficientes para un n\u00famero v\u00e1lido.
 *  - "+54 9 11 1234-5678" \u2192 "5491112345678"
 *  - "11 1234 5678"       \u2192 "541112345678"
 */
export function normalizarTelefonoAr(telefono: string | null | undefined): string | null {
  if (!telefono) return null;
  let d = telefono.replace(/\D/g, "");
  if (!d) return null;
  // Quitar 00 internacional o 0 de larga distancia nacional al inicio.
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length < 8) return null;
  if (!d.startsWith("54")) {
    if (d.startsWith("0")) d = d.slice(1); // 011... \u2192 11...
    d = "54" + d;
  }
  return d.length >= 10 && d.length <= 15 ? d : null;
}

/**
 * Normaliza un sitio web escrito a mano al formato que guardamos en la DB.
 *
 * Los socios escriben "www.miempresa.com" o "miempresa.com.ar", nunca el
 * esquema. Antes el input era type="url" y el browser bloqueaba el submit
 * con "Introduce una URL", dejando el formulario entero sin poder guardarse.
 *  - "www.metlongchamps.com"    → "https://www.metlongchamps.com"
 *  - "http://miempresa.com.ar"  → "http://miempresa.com.ar" (respeta el esquema)
 *  - "   "                      → null
 */
export function normalizarSitioWeb(url: string | null | undefined): string | null {
  if (!url) return null;
  const limpio = url.trim().replace(/^\/+/, "");
  if (!limpio) return null;
  // Sólo anteponemos https:// cuando no hay un esquema propio, así no rompemos
  // los http:// viejos ni un eventual mailto:.
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(limpio) ? limpio : `https://${limpio}`;
}

/**
 * ¿Tiene forma de correo? Deliberadamente permisiva: sólo descarta lo que
 * seguro no es un mail (sin arroba, sin dominio, con espacios). No intentamos
 * validar direcciones de verdad, para eso hay que mandarles un correo.
 *
 * Existe para poder sacar los `type="email"` de los formularios: el navegador
 * los valida solo, pero lo hace con su cartel emergente nativo, que tapa el
 * bloque de al lado, desaparece por su cuenta y — lo peor — bloquea el submit
 * del formulario entero (item 2.3 del reporte de Lucas, el mismo problema que
 * tenía el campo de sitio web). Validando nosotros, el mensaje va en línea
 * debajo del campo y con el estilo del resto del formulario.
 */
export function pareceEmail(valor: string | null | undefined): boolean {
  const v = (valor ?? "").trim();
  if (!v || /\s/.test(v)) return false;
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(v);
}

/** Link de WhatsApp click-to-chat. `texto` opcional pre-rellena el mensaje. */
export function whatsappLink(
  telefono: string | null | undefined,
  texto?: string
): string | null {
  const num = normalizarTelefonoAr(telefono);
  if (!num) return null;
  const base = `https://wa.me/${num}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}
