"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { ComunicadoPublico } from "../tipos";
import { EncabezadoPublicacion } from "./encabezado-publicacion";

/**
 * La foto de una publicación en grande, dentro de la web (como el visor de X):
 * fondo oscuro, la foto entera ocupando todo lo que puede y, al costado, la
 * publicación con el texto completo. En el celular la foto va arriba y el texto
 * abajo.
 *
 * Se cierra con la X, con Escape o tocando el fondo (no la foto). Mientras está
 * abierto la página de atrás no scrollea.
 */
export function VisorFoto({ c, onCerrar }: { c: ComunicadoPublico; onCerrar: () => void }) {
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const foco = document.activeElement as HTMLElement | null;
    cerrarRef.current?.focus();

    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = overflowPrevio;
      foco?.focus?.(); // el foco vuelve a la foto que lo abrió
    };
  }, [onCerrar]);

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
        {/* <img> y no next/image a propósito: acá va el original a su tamaño
            natural, achicado sólo para entrar en la pantalla. next/image con
            width/height en 0 (no sabemos la proporción) se dibuja de 0×0. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={c.imagenUrl!}
          alt={c.titulo || "Foto de la publicación"}
          className="max-h-full max-w-full select-none object-contain shadow-2xl"
        />
      </div>

      {/* La publicación al costado (abajo en el celular). */}
      {(c.titulo || c.cuerpo) && (
        <aside className="max-h-[35vh] shrink-0 overflow-y-auto border-t border-white/10 bg-white p-4 md:max-h-none md:w-[360px] md:border-l md:border-t-0 md:p-5">
          <EncabezadoPublicacion c={c} alSeguirLink={onCerrar} />
          {c.titulo && (
            <h2 className="mt-3 text-[16px] font-bold leading-snug text-slate-900">{c.titulo}</h2>
          )}
          {c.cuerpo && (
            <p className="mt-2 whitespace-pre-line break-words text-[15px] leading-relaxed text-slate-800">
              {c.cuerpo}
            </p>
          )}
        </aside>
      )}
    </div>,
    document.body
  );
}
