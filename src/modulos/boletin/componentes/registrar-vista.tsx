"use client";

import { useEffect, useRef } from "react";

/**
 * Anota una vista de la nota una sola vez por montaje. No dibuja nada, así que
 * no cambia el HTML que reciben Google ni el lector: el pedido sale recién
 * después de hidratar.
 *
 * La página no lo monta para los admins (y la ruta los filtra igual). Los
 * navegadores automatizados se delatan con `navigator.webdriver`.
 */
export function RegistrarVistaNota({ id }: { id: string }) {
  const hecho = useRef(false);
  useEffect(() => {
    if (hecho.current || !id) return;
    hecho.current = true;
    if (navigator.webdriver) return;
    fetch("/api/boletin/vista", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      // Que salga aunque la persona se vaya enseguida de la página.
      keepalive: true,
    }).catch(() => {});
  }, [id]);
  return null;
}
