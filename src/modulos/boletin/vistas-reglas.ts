import { createHash } from "node:crypto";
import { diaLocal } from "@/modulos/visitas/estadisticas";

/**
 * Las reglas de qué cuenta como una vista de una nota del Boletín. Puras, sin
 * base, para poder probarlas (`src/tests/modulos/boletin-vistas.test.ts`).
 *
 * QUÉ SE CUENTA: visitantes únicos por día. Una persona que abre la nota tres
 * veces el mismo día es una vista; si vuelve mañana, son dos. El número que
 * pidió la UIAB es "cuánta gente entró", y una vista por carga lo infla con
 * cada F5 o cada vez que alguien vuelve a la pestaña.
 *
 * Lo que no se cuenta lo filtra la ruta (`/api/boletin/vista`) con estas
 * funciones: bots, navegadores automatizados y los propios admins.
 */

/**
 * Los rastreadores que se anuncian. Los que no se anuncian y no corren JS
 * tampoco cuentan, porque la vista se registra desde el navegador después de
 * hidratar; los que sí corren JS (el renderizador de Google, Lighthouse, los
 * monitores) son los que dicen su nombre en el user agent.
 */
const PATRON_BOT =
  /bot\b|bot\/|crawl|spider|slurp|mediapartners|facebookexternalhit|facebookcatalog|whatsapp|telegram|discord|slack|skype|embedly|preview|headless|phantom|puppeteer|playwright|selenium|lighthouse|pagespeed|chrome-lighthouse|gtmetrix|pingdom|uptime|monitor|curl\/|wget\/|python|axios|node-fetch|undici|go-http|java\/|okhttp|httpclient|libwww|scrapy|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|yandex|baiduspider|duckduck|applebot|gptbot|claudebot|anthropic|perplexity|ccbot|vercel/i;

export function esUserAgentDeBot(ua: string | null | undefined): boolean {
  const limpio = (ua ?? "").trim();
  // Un navegador de verdad siempre manda user agent.
  if (!limpio) return true;
  return PATRON_BOT.test(limpio);
}

export function esUuid(x: unknown): x is string {
  return typeof x === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
}

/** El día de la vista, en hora argentina (`YYYY-MM-DD`). */
export function diaDeVista(ms: number = Date.now()): string {
  return diaLocal(ms);
}

/**
 * La primera IP de `x-forwarded-for` es la del cliente (Vercel la pone ahí).
 * Sin cabecera, `x-real-ip`; si tampoco, cadena vacía — el hash igual sale,
 * apoyado en el user agent.
 */
export function ipDelPedido(headers: Headers): string {
  const reenviada = headers.get("x-forwarded-for");
  if (reenviada) return reenviada.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() ?? "";
}

/**
 * Quién es el visitante, para el dedup del día.
 *
 * Con sesión, su perfil: la misma persona en el celular y en la compu es una.
 * Sin sesión, un hash de día + IP + user agent con un secreto del servidor
 * como sal. Lleva el día adentro, así que cambia todas las jornadas: no hay
 * forma de seguir a alguien de un día al otro ni de volver a su IP, y no hace
 * falta cookie (ni cartel de cookies) para contar.
 */
export function idVisitante(opciones: {
  perfilId: string | null;
  dia: string;
  ip: string;
  userAgent: string;
  sal: string;
}): string {
  if (opciones.perfilId) return `u:${opciones.perfilId}`;
  const hash = createHash("sha256")
    .update([opciones.sal, opciones.dia, opciones.ip, opciones.userAgent].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `a:${hash}`;
}
