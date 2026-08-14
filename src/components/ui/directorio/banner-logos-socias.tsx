"use client";

import { useState } from "react";
import Image from "next/image";
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
        <Image
          src={empresa.logoUrl}
          alt={`Logo de ${empresa.nombre} — empresa socia de la UIAB`}
          width={200}
          height={90}
          // eager: dentro del track animado (transform) el lazy loading nativo
          // nunca se dispara y los logos quedan en blanco mientras scrollea.
          loading="eager"
          className="object-contain max-h-[90px] max-w-[200px] transition-transform duration-300"
          onError={() => setErrorLogo(true)}
        />
      )}
    </Link>
  );
}
