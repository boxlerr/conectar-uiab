"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import type { AdjuntoOportunidad } from "@/modulos/oportunidades/adjuntos";

/**
 * Galería del hero del detalle: la foto principal es clickeable y abre un
 * visor a pantalla completa; en ambos niveles se puede pasar de imagen con
 * las flechas, el teclado (← → Esc) o deslizando en el teléfono.
 *
 * `portadaFallback` es la imagen genérica del rubro (generada, en /public)
 * para oportunidades publicadas sin fotos: se muestra pero no abre visor —
 * no es contenido de la oportunidad, es decoración.
 */
export function GaleriaOportunidad({
  imagenes,
  portadaFallback,
  titulo,
}: {
  imagenes: AdjuntoOportunidad[];
  portadaFallback: string;
  titulo: string;
}) {
  const [indice, setIndice] = useState(0);
  const [visorAbierto, setVisorAbierto] = useState(false);

  const hayImagenes = imagenes.length > 0;
  const actual = hayImagenes ? imagenes[Math.min(indice, imagenes.length - 1)] : null;

  const irA = useCallback(
    (destino: number) => {
      if (imagenes.length === 0) return;
      setIndice((destino + imagenes.length) % imagenes.length);
    },
    [imagenes.length]
  );

  const anterior = useCallback(() => irA(indice - 1), [irA, indice]);
  const siguiente = useCallback(() => irA(indice + 1), [irA, indice]);

  return (
    <>
      <figure className="group relative h-full w-full overflow-hidden rounded-2xl bg-[#0b2d4d]">
        {actual ? (
          <button
            type="button"
            onClick={() => setVisorAbierto(true)}
            className="absolute inset-0 block h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label={`Ver "${actual.nombre}" en pantalla completa`}
          >
            <Image
              src={actual.url}
              alt={`${titulo} — ${actual.nombre}`}
              fill
              sizes="(min-width: 1024px) 420px, 100vw"
              quality={75}
              priority
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Expand className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>
        ) : (
          <Image
            src={portadaFallback}
            alt=""
            aria-hidden="true"
            fill
            sizes="(min-width: 1024px) 420px, 100vw"
            quality={60}
            priority
            className="object-cover"
          />
        )}

        {hayImagenes && imagenes.length > 1 && (
          <>
            <BotonFlecha direccion="izquierda" onClick={anterior} />
            <BotonFlecha direccion="derecha" onClick={siguiente} />
            <div
              className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5"
              aria-hidden="true"
            >
              {imagenes.map((imagen, i) => (
                <span
                  key={imagen.ruta}
                  className={`h-1.5 rounded-full transition-all ${
                    i === indice ? "w-5 bg-white" : "w-1.5 bg-white/45"
                  }`}
                />
              ))}
            </div>
            <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white backdrop-blur-sm">
              {indice + 1} / {imagenes.length}
            </span>
          </>
        )}
      </figure>

      {visorAbierto && actual && (
        <VisorImagenes
          imagenes={imagenes}
          indice={indice}
          onNavegar={irA}
          onCerrar={() => setVisorAbierto(false)}
          titulo={titulo}
        />
      )}
    </>
  );
}

function BotonFlecha({
  direccion,
  onClick,
  grande = false,
}: {
  direccion: "izquierda" | "derecha";
  onClick: () => void;
  grande?: boolean;
}) {
  const Icono = direccion === "izquierda" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={(evento) => {
        evento.stopPropagation();
        onClick();
      }}
      aria-label={direccion === "izquierda" ? "Imagen anterior" : "Imagen siguiente"}
      className={`absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
        grande ? "h-12 w-12" : "h-9 w-9"
      } ${direccion === "izquierda" ? (grande ? "left-4" : "left-3") : grande ? "right-4" : "right-3"}`}
    >
      <Icono className={grande ? "h-6 w-6" : "h-5 w-5"} aria-hidden="true" />
    </button>
  );
}

/** Visor a pantalla completa. */
function VisorImagenes({
  imagenes,
  indice,
  onNavegar,
  onCerrar,
  titulo,
}: {
  imagenes: AdjuntoOportunidad[];
  indice: number;
  onNavegar: (destino: number) => void;
  onCerrar: () => void;
  titulo: string;
}) {
  const actual = imagenes[Math.min(indice, imagenes.length - 1)];
  const toqueX = useRef<number | null>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  // Teclado + bloqueo del scroll de fondo mientras el visor está abierto.
  useEffect(() => {
    const manejarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onCerrar();
      if (evento.key === "ArrowLeft") onNavegar(indice - 1);
      if (evento.key === "ArrowRight") onNavegar(indice + 1);
    };
    window.addEventListener("keydown", manejarTecla);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cerrarRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", manejarTecla);
      document.body.style.overflow = overflowPrevio;
    };
  }, [indice, onCerrar, onNavegar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Imágenes de ${titulo}`}
      className="fixed inset-0 z-[70] flex flex-col bg-slate-950/95 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCerrar}
      onTouchStart={(evento) => {
        toqueX.current = evento.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(evento) => {
        if (toqueX.current == null) return;
        const delta = (evento.changedTouches[0]?.clientX ?? toqueX.current) - toqueX.current;
        toqueX.current = null;
        // Deslizar para pasar de imagen (umbral de 48px para no confundir taps).
        if (Math.abs(delta) < 48) return;
        onNavegar(delta > 0 ? indice - 1 : indice + 1);
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold tabular-nums text-white/90">
          {indice + 1} / {imagenes.length}
        </span>
        <button
          ref={cerrarRef}
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar visor"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-3 sm:px-16">
        {/* La imagen del visor va con <img>: es el original del bucket a
            pantalla completa, no queremos otra transformation de Vercel. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={actual.url}
          alt={`${titulo} — ${actual.nombre}`}
          className="max-h-full max-w-full rounded-lg object-contain"
          onClick={(evento) => evento.stopPropagation()}
        />
        {imagenes.length > 1 && (
          <>
            <BotonFlecha direccion="izquierda" onClick={() => onNavegar(indice - 1)} grande />
            <BotonFlecha direccion="derecha" onClick={() => onNavegar(indice + 1)} grande />
          </>
        )}
      </div>

      <p className="px-4 pb-4 text-center text-sm font-medium text-white/70">
        {actual.nombre}
      </p>
    </div>
  );
}
