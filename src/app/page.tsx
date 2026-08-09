import type { Metadata } from "next";
import Inicio from "./inicio-cliente";

/**
 * La portada es un Server Component finito cuyo único trabajo es declarar la
 * metadata; todo el markup vive en `inicio-cliente.tsx`.
 *
 * Hizo falta partirla porque `export const metadata` no existe en un
 * `"use client"`, y la home era justamente eso. Mientras el canonical del sitio
 * vivió en el layout raíz no se notaba — pero ese canonical se heredaba a todas
 * las rutas y las convertía en duplicados de la portada (ver layout.tsx).
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Page() {
  return <Inicio />;
}
