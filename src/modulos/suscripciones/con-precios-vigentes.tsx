import type { ReactNode } from "react";
import { leerPrecios } from "@/lib/suscripciones/precios";
import { ProveedorPrecios } from "./contexto-precios";

/**
 * Server Component: lee el precio que el admin carga en /admin/suscripciones y
 * se lo deja a la página de cliente que envuelve (ver ./contexto-precios).
 *
 * Va en el layout del segmento y no en la página porque esas páginas son
 * "use client" enteras; partirlas en server + cliente era mover archivos de
 * cientos de líneas para pasar dos números.
 *
 * `leerPrecios()` no tira: si la base falla devuelve la constante, así que una
 * caída de Supabase no deja la pantalla en blanco. Cuando el admin cambia el
 * precio, `actualizarPrecios()` revalida estas rutas.
 */
export async function ConPreciosVigentes({ children }: { children: ReactNode }) {
  const precios = await leerPrecios();
  return <ProveedorPrecios precios={precios}>{children}</ProveedorPrecios>;
}
