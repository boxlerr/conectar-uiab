"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

/**
 * Las fotos de una publicación, pasables de costado.
 *
 * CÓMO SE MUEVE. La pista es un contenedor con scroll horizontal y
 * `scroll-snap`, no un carrusel con transform: así el gesto del dedo en el
 * celular lo maneja el browser —con su inercia y su rebote— sin una línea de
 * JS, y las flechas de escritorio no son más que un `scrollBy`. El índice se
 * lee del scroll, que es la única fuente de verdad: si el usuario arrastra
 * hasta la mitad y suelta, los puntitos siguen a la foto que quedó.
 *
 * POR QUÉ CAMBIA DE FORMA SEGÚN CUÁNTAS HAYA:
 *   - Una sola: se dibuja entera, a su proporción real (`h-auto`), que es como
 *     venía el boletín. Un flyer vertical no se recorta ni queda con bandas.
 *   - Varias: marco de proporción fija y `object-contain`. Con alturas
 *     distintas la tarjeta pegaría saltos al pasar de una a otra, y el pulgar
 *     pierde el hilo.
 *
 * Con teclado: ← y → cuando la pista tiene el foco.
 */
export function CarruselFotos({
  imagenes,
  alto = "aspect-[4/3]",
  sizes,
  alAbrir,
  prioridad = false,
}: {
  imagenes: string[];
  /** Clase de proporción del marco cuando hay más de una foto. */
  alto?: string;
  sizes: string;
  /** Abrir la foto en grande. Sin esto, las fotos no son clickeables. */
  alAbrir?: (indice: number) => void;
  prioridad?: boolean;
}) {
  const pista = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);

  const total = imagenes.length;
  const varias = total > 1;

  const irA = useCallback((i: number) => {
    const el = pista.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }, []);

  // El índice sale del scroll y no de un estado propio: el dedo puede mover la
  // pista sin pasar por las flechas.
  useEffect(() => {
    const el = pista.current;
    if (!el || !varias) return;
    let pendiente = 0;
    const alScrollear = () => {
      cancelAnimationFrame(pendiente);
      pendiente = requestAnimationFrame(() => {
        setActual(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
      });
    };
    el.addEventListener("scroll", alScrollear, { passive: true });
    return () => {
      cancelAnimationFrame(pendiente);
      el.removeEventListener("scroll", alScrollear);
    };
  }, [varias]);

  if (total === 0) return null;

  const Foto = ({ src, i }: { src: string; i: number }) => {
    const img = (
      <Image
        src={src}
        alt=""
        width={0}
        height={0}
        sizes={sizes}
        priority={prioridad && i === 0}
        className={
          varias
            ? "absolute inset-0 h-full w-full object-contain"
            : "block h-auto max-h-[34rem] w-full object-contain"
        }
      />
    );
    const clase = `relative w-full shrink-0 snap-center bg-slate-950 ${varias ? alto : ""}`;

    if (!alAbrir) return <div className={clase}>{img}</div>;
    return (
      <button
        type="button"
        onClick={() => alAbrir(i)}
        aria-label={varias ? `Ver la foto ${i + 1} de ${total} en grande` : "Ver la foto en grande"}
        className={`${clase} group cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500`}
      >
        {img}
        <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11.5px] font-semibold text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <Maximize2 className="h-3 w-3" />
          Ver en grande
        </span>
      </button>
    );
  };

  return (
    <div className="relative">
      <div
        ref={pista}
        tabIndex={varias ? 0 : -1}
        role={varias ? "group" : undefined}
        aria-roledescription={varias ? "carrusel" : undefined}
        aria-label={varias ? `${total} fotos` : undefined}
        onKeyDown={(e) => {
          if (!varias) return;
          if (e.key === "ArrowRight") irA(Math.min(total - 1, actual + 1));
          if (e.key === "ArrowLeft") irA(Math.max(0, actual - 1));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
      >
        {imagenes.map((src, i) => (
          <Foto key={src} src={src} i={i} />
        ))}
      </div>

      {varias && (
        <>
          {/* Flechas: de escritorio. En el celular se pasa con el dedo y dos
              botones encima de la foto sólo tapan. */}
          <Flecha lado="izq" onClick={() => irA(actual - 1)} oculta={actual === 0} />
          <Flecha lado="der" onClick={() => irA(actual + 1)} oculta={actual === total - 1} />

          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11.5px] font-bold tabular-nums text-white backdrop-blur-sm">
            {actual + 1}/{total}
          </span>

          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {imagenes.map((src, i) => (
              <span
                key={src}
                className={`h-1.5 rounded-full transition-all ${
                  i === actual ? "w-4 bg-white" : "w-1.5 bg-white/55"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Flecha({
  lado,
  onClick,
  oculta,
}: {
  lado: "izq" | "der";
  onClick: () => void;
  oculta: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={lado === "izq" ? "Foto anterior" : "Foto siguiente"}
      // `hidden sm:flex`: en el celular manda el gesto.
      className={`absolute top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md transition-all hover:bg-white sm:flex ${
        lado === "izq" ? "left-3" : "right-3"
      } ${oculta ? "pointer-events-none opacity-0" : "opacity-90 hover:opacity-100"}`}
    >
      {lado === "izq" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </button>
  );
}
