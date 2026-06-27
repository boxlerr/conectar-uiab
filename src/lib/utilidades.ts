import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
