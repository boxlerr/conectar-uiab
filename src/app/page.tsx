import type { Metadata } from "next";
import Inicio from "./inicio-cliente";
import { obtenerSociasConLogo } from "@/lib/datos/socias-logos";
import { ExplorarPorRubro } from "@/components/ui/directorio/explorar-por-rubro";

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

/**
 * El marquee de logos ahora se resuelve acá y baja por props.
 *
 * Era un fetch en useEffect dentro de un client component, así que la home le
 * servía a Googlebot CERO enlaces a fichas: los ~50 `<Link>` del marquee recién
 * aparecían después de hidratar. Con las fichas colgando de un solo documento
 * (/directorio) y sin backlinks externos, ese era el enlace interno más caro
 * que el proyecto estaba tirando a la basura.
 */
export default async function Page() {
  const sociasLogos = await obtenerSociasConLogo();
  return (
    <>
      <Inicio sociasLogos={sociasLogos} />
      {/*
        La portada no enlazaba NINGUNA de las 13 landings de rubro (medido con
        curl: 0 href="/rubros/..."), así que colgaban sólo de /directorio y
        /empresas. Es la página con más autoridad del sitio y la que Google
        rastrea más seguido: dejarla sin salida hacia la capa intermedia
        desperdicia el único enlazado interno que controlamos.

        Sin `entidades` a propósito — ver el comentario del componente.
      */}
      <ExplorarPorRubro />
    </>
  );
}
