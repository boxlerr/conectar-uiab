"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Compositor } from "./compositor";
import { TarjetaSiguiente } from "./rieles";

/**
 * Las partes del /boletin que cambian según quién mira, resueltas en el
 * navegador. La página sale estática del CDN —el mismo HTML para todos—, así
 * que el servidor ya no puede preguntar el rol. Mientras la sesión no se sabe
 * se dibuja lo del visitante, que es lo que tiene que indexar Google.
 */

/** El cuadro para publicar. Sólo admins; publicar lo valida el Server Action. */
export function CompositorSoloAdmin() {
  const { currentUser } = useAuth();
  return currentUser?.role === "admin" ? <Compositor /> : null;
}

export function TarjetaSiguienteSegunSesion() {
  const { currentUser } = useAuth();
  return <TarjetaSiguiente haySesion={!!currentUser} />;
}
