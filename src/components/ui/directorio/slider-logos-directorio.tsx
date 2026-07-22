"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

/**
 * Slider/marquee de logos para el directorio. A diferencia de
 * `BannerLogosSocias` (que hace su propio fetch client-side y muestra un
 * skeleton mientras carga), este recibe los logos por props: el directorio ya
 * los trae del servidor (SSR), así que se ven al instante, sin fetch ni estado
 * de carga que pueda quedar colgado.
 *
 * Orden ESTABLE (sin shuffle) a propósito: mezclar en render rompería la
 * hidratación (server y client barajarían distinto). El loop se arma duplicando
 * la lista.
 */

export interface LogoDirectorio {
  slug: string;
  nombre: string;
  logoUrl: string;
  basePath?: string;
}

export function SliderLogosDirectorio({ logos }: { logos: LogoDirectorio[] }) {
  if (logos.length === 0) return null;

  // Aseguramos que el track sea más ancho que la pantalla (si son pocos, se
  // repiten) y lo duplicamos para que translateX(-50%) cierre el loop sin salto.
  const minItems = 12;
  const pasadas = Math.max(2, Math.ceil(minItems / logos.length));
  const base = Array.from({ length: pasadas }, () => logos).flat();
  const items = [...base, ...base];

  return (
    <div
      className="group relative overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      <div
        className="marquee-track flex items-center gap-16 w-max"
        style={{ animationDuration: `${pasadas * 90}s` }}
      >
        {items.map((logo, i) => (
          <LogoItemView key={`${logo.slug}-${i}`} logo={logo} />
        ))}
      </div>
    </div>
  );
}

function formatearWordmark(nombre: string): string {
  return nombre
    .replace(/\s*(S\.?A\.?|S\.?R\.?L\.?|S\.?A\.?S\.?|SRL|SA|SAS)\.?$/i, "")
    .trim()
    .toUpperCase();
}

function LogoItemView({ logo }: { logo: LogoDirectorio }) {
  const [errorLogo, setErrorLogo] = useState(false);
  const href = `${logo.basePath ?? "/empresas"}/${logo.slug}`;

  return (
    <Link
      href={href}
      className="flex-shrink-0 w-[220px] h-[100px] flex items-center justify-center px-6 transition-transform duration-300 ease-out hover:scale-125"
      title={`Ver el perfil de ${logo.nombre} en UIAB Conecta`}
      aria-label={`Ver el perfil de ${logo.nombre} en UIAB Conecta`}
    >
      {errorLogo ? (
        <span
          className="text-center text-[14px] font-extrabold text-slate-400 uppercase leading-tight tracking-[0.08em] line-clamp-2"
          style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
        >
          {formatearWordmark(logo.nombre)}
        </span>
      ) : (
        <Image
          src={logo.logoUrl}
          alt={`Logo de ${logo.nombre} — empresa de la red UIAB`}
          width={190}
          height={80}
          loading="eager"
          className="object-contain max-h-[80px] max-w-[190px]"
          onError={() => setErrorLogo(true)}
        />
      )}
    </Link>
  );
}
