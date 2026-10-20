"use client";

import { useSyncExternalStore } from "react";
import { tiempoCorto } from "../formato";

/**
 * "22 h", "3 d"… calculado otra vez en el navegador después de hidratar.
 *
 * El /boletin sale del caché del CDN: el HTML se generó en algún momento de la
 * última hora (o antes, si nadie entró). Sin esto quedaba congelado lo que
 * decía ese HTML, porque `suppressHydrationWarning` no corrige el texto, sólo
 * calla el aviso. `useSyncExternalStore` da false al hidratar y true después:
 * ese cambio es el re-render que lo pone al día.
 */
const sinSuscripcion = () => () => {};

export function TiempoCorto({ iso }: { iso: string | null }) {
  useSyncExternalStore(sinSuscripcion, () => true, () => false);
  return (
    <time dateTime={iso ?? undefined} suppressHydrationWarning>
      {tiempoCorto(iso)}
    </time>
  );
}
