"use client";

import { useState } from "react";
import Link from "next/link";
import type { SociaConLogo } from "@/lib/datos/socias-logos";

/**
 * Marquee de logos de las socias.
 *
 * ANTES traía los datos con un useEffect contra `empresas_publicas_logos`, así
 * que sus ~50 `<Link href="/empresas/{slug}">` sólo existían después de
 * hidratar: el HTML de la home que recibía Googlebot tenía CERO enlaces a
 * fichas. El comentario del componente decía que el marquee servía "para que
 * Google indexe y posicione las fichas" — hacía justo lo contrario.
 *
 * AHORA la consulta vive en `src/lib/datos/socias-logos.ts` y la resuelven los
 * Server Components (src/app/page.tsx y src/app/empresas/page.tsx), que pasan
 * el array por props. Este archivo quedó como presentación pura.
 *
 * Ojo con el orden: el barajado dejó de ser `Math.random()` en el cliente y
 * pasó a hacerse en el servidor con semilla del día. Con la mezcla en el
 * cliente el HTML del servidor y el primer render no coincidían.
 *
 * POR QUÉ `<img>` NATIVO Y NO `next/image`
 *
 * Los logos tienen que cargar sí o sí (con `loading="lazy"` quedan en blanco:
 * medido, con el marquee en pantalla y tres segundos de espera, los cuatro
 * logos visibles seguían sin bajar — el observer del lazy no acompaña el
 * `transform` del track). Pero `next/image` con `loading="eager"` no sólo baja
 * la imagen: emite un `<link rel="preload" as="image">` por URL, y el track
 * repite las 58 socias ocho veces. La home mandaba 58 preloads (~1,2 MB) que
 * competían con el hero, que es el LCP.
 *
 * Un `<img>` nativo eager baja las mismas imágenes pero SIN preload: el
 * navegador las pide con prioridad normal, detrás de lo crítico. Los logos
 * pesan 21 KB de media (máximo 60), así que saltear el resize de `/_next/image`
 * cuesta poco — y de paso no gasta transformaciones de Vercel.
 */
export function BannerLogosSocias({ empresas }: { empresas: SociaConLogo[] }) {
  if (empresas.length === 0) return null;
  return <MarqueeEmpresas empresas={empresas} />;
}

function MarqueeEmpresas({ empresas }: { empresas: SociaConLogo[] }) {
  // El orden ya viene barajado del servidor con la semilla del día, así que acá
  // sólo se encadenan pasadas para que la mitad del track sea más ancha que la
  // pantalla (si no, el loop "salta" al resetear). Nada de Math.random(): el
  // HTML del servidor y el primer render del cliente tienen que coincidir.
  const minItems = 8;
  const pasadas = Math.max(4, Math.ceil(minItems / empresas.length));
  const items = Array.from({ length: pasadas * 2 }, () => empresas).flat();

  return (
    <div
      className="group relative overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    >
      <div
        className="marquee-track flex items-center gap-16 w-max"
        // 120s es el tiempo original pensado para una sola pasada; al
        // encadenar varias pasadas mezcladas escalamos la duración para
        // no acelerar visualmente el scroll.
        style={{ animationDuration: `${pasadas * 120}s` }}
      >
        {items.map((emp, i) => (
          <LogoSocia key={`${emp.id}-${i}`} empresa={emp} />
        ))}
      </div>
    </div>
  );
}

/**
 * Formatea el nombre como un "wordmark" tipo logo cloud profesional.
 * Quitamos sufijos legales (S.A., S.R.L., etc) que ensucian visualmente
 * y dejamos el nombre principal en mayúsculas con letter-spacing.
 */
function formatearWordmark(nombre: string): string {
  return nombre
    .replace(/\s*(S\.?A\.?|S\.?R\.?L\.?|S\.?A\.?S\.?|SRL|SA|SAS)\.?$/i, "")
    .trim()
    .toUpperCase();
}

function LogoSocia({ empresa }: { empresa: SociaConLogo }) {
  const [errorLogo, setErrorLogo] = useState(false);
  const mostrarFallback = !empresa.logoUrl || errorLogo;
  const wordmark = formatearWordmark(empresa.nombre);

  return (
    // Enlaza a la ficha de la empresa (el marquee se pausa en hover, así se
    // puede clickear). También genera un enlace interno hacia cada perfil, que
    // ayuda a que Google indexe y posicione las fichas del directorio.
    <Link
      href={`/empresas/${empresa.slug}`}
      className="flex-shrink-0 w-[240px] h-[110px] flex items-center justify-center px-6 transition-transform duration-300 ease-out hover:scale-125"
      title={`Ver el perfil de ${empresa.nombre} en UIAB Conecta`}
      aria-label={`Ver el perfil de ${empresa.nombre}, empresa socia de la UIAB, en UIAB Conecta`}
    >
      {mostrarFallback ? (
        <span
          className="text-center text-[15px] font-extrabold text-slate-400 uppercase leading-tight tracking-[0.08em] line-clamp-2 transition-colors duration-300 group-hover:text-slate-500"
          style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
        >
          {wordmark}
        </span>
      ) : (
        /*
          El logo va como `background-image` y no como `<img>`.
          Es la única variante que carga el logo de entrada SIN meter un
          `<link rel="preload">` por socia en el `<head>` — ver el comentario
          de arriba. El nombre de la empresa no se pierde para lectores de
          pantalla ni para Google: ya viaja en el `aria-label` y el `title` del
          enlace que envuelve esto, así que el `alt` sería redundante y este
          nodo queda como decoración pura.
        */
        <span
          aria-hidden="true"
          className="block w-[200px] h-[90px] transition-transform duration-300"
          style={{
            backgroundImage: `url("${empresa.logoUrl}")`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}
    </Link>
  );
}
