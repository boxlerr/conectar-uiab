import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Las pantallas de sesión (login, register, recuperación de contraseña,
 * confirmación de email, bienvenida) se rastrean pero NO se indexan.
 *
 * Reemplaza al `Disallow` que tenían en robots.txt. `/register` está linkeado 7
 * veces desde páginas públicas — la home, los planes, las fichas de las socias —
 * así que Google lo descubría, se chocaba con el bloqueo y lo reportaba como
 * "Bloqueada por robots.txt" (el aviso de Search Console del 05/08/2026). Y
 * peor: una URL bloqueada pero linkeada Google la puede listar igual, sin
 * título ni descripción, y ya no hay forma de sacarla porque nunca más entra a
 * leer. Dejándolo rastrear, ve este `noindex` y la descarta de verdad.
 *
 * `follow: true` para que el link equity que reciben estas páginas siga
 * fluyendo hacia el directorio público al que enlazan.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
