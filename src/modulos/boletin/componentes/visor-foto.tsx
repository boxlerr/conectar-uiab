"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cuerpoSinMarcas } from "../formato";
import type { ComunicadoPublico } from "../tipos";
import { EncabezadoPublicacion } from "./encabezado-publicacion";

/**
 * Las fotos de una publicación en grande, dentro de la web (como el visor de
 * X): fondo oscuro, la foto entera ocupando todo lo que puede y, al costado, la
 * publicación con el texto completo. En el celular la foto va arriba y el texto
 * abajo.
 *
 * Con varias fotos se pasa con las flechas de la pantalla o con ← y → del
 * teclado, y abre en la que se tocó (`desde`), no siempre en la primera.
 *
 * Se cierra con la X, con Escape o tocando el fondo (no la foto). Mientras está
 * abierto la página de atrás no scrollea.
 */
export function VisorFoto({
  c,
  desde = 0,
  onCerrar,
}: {
  c: ComunicadoPublico;
  desde?: number;
  onCerrar: () => void;
}) {
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const [actual, setActual] = useState(desde);

  const fotos = c.imagenes;
  const total = fotos.length;

  useEffect(() => {
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const foco = document.activeElement as HTMLElement | null;
    cerrarRef.current?.focus();

    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowRight") setActual((i) => Math.min(total - 1, i + 1));
      if (e.key === "ArrowLeft") setActual((i) => Math.max(0, i - 1));
    }
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = overflowPrevio;
      foco?.focus?.(); // el foco vuelve a la foto que lo abrió
    };
  }, [onCerrar, total]);

  if (total === 0) return null;
  const indice = Math.min(actual, total - 1);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Foto de la publicación"
      className="fixed inset-0 z-[100] flex flex-col bg-black md:flex-row md:bg-black/95"
    >
      {/* La foto. Tocar el fondo alrededor cierra; tocar la foto, no. */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center p-3 sm:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) onCerrar();
        }}
      >
        <button
          ref={cerrarRef}
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-4 sm:top-4"
        >
          <X className="h-5 w-5" />
        </button>

        {total > 1 && (
          <span className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-[12.5px] font-bold tabular-nums text-white backdrop-blur-sm">
            {indice + 1} / {total}
          </span>
        )}

        {/* <img> y no next/image a propósito: acá va el original a su tamaño
            natural, achicado sólo para entrar en la pantalla. next/image con
            width/height en 0 (no sabemos la proporción) se dibuja de 0×0. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fotos[indice]}
          alt={c.titulo || "Foto de la publicación"}
          className="max-h-full max-w-full select-none object-contain shadow-2xl"
        />

        {total > 1 && (
          <>
            <FlechaVisor
              lado="izq"
              oculta={indice === 0}
              onClick={() => setActual(indice - 1)}
            />
            <FlechaVisor
              lado="der"
              oculta={indice === total - 1}
              onClick={() => setActual(indice + 1)}
            />
          </>
        )}
      </div>

      {/* La publicación al costado (abajo en el celular). */}
      {(c.titulo || c.bajada || c.cuerpo) && (
        <aside className="max-h-[35vh] shrink-0 overflow-y-auto border-t border-white/10 bg-white p-4 md:max-h-none md:w-[360px] md:border-l md:border-t-0 md:p-5">
          <EncabezadoPublicacion c={c} alSeguirLink={onCerrar} />
          {c.titulo && (
            <h2 className="mt-3 text-[16px] font-bold leading-snug text-slate-900">{c.titulo}</h2>
          )}
          {(c.bajada || c.cuerpo) && (
            <p className="mt-2 whitespace-pre-line break-words text-[15px] leading-relaxed text-slate-800">
              {c.bajada?.trim() || cuerpoSinMarcas(c.cuerpo)}
            </p>
          )}
        </aside>
      )}
    </div>,
    document.body
  );
}

function FlechaVisor({
  lado,
  oculta,
  onClick,
}: {
  lado: "izq" | "der";
  oculta: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={lado === "izq" ? "Foto anterior" : "Foto siguiente"}
      className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
        lado === "izq" ? "left-3 sm:left-5" : "right-3 sm:right-5"
      } ${oculta ? "pointer-events-none opacity-0" : ""}`}
    >
      {lado === "izq" ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
    </button>
  );
}
