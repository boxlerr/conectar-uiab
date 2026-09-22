"use client";

import { X } from "lucide-react";
import type { FotoEnEdicion } from "../use-fotos";

/**
 * Las fotos elegidas mientras se escribe la publicación: miniatura, barra de
 * progreso mientras sube y una × para sacarla. Lo comparten el cuadro del feed
 * y el formulario del panel.
 *
 * Con una sola foto se muestra grande y entera (`object-contain`, como se va a
 * ver publicada). Con varias, una grilla de cuadrados recortados: son
 * miniaturas para ordenar y descartar, no la vista final.
 *
 * La PRIMERA lleva el rótulo "Portada" porque no es una foto más: es la que va
 * en la tarjeta del feed y la que se ve cuando alguien pega el enlace en
 * WhatsApp.
 */
export function FotosEnEdicion({
  fotos,
  onQuitar,
  deshabilitado = false,
}: {
  fotos: FotoEnEdicion[];
  onQuitar: (id: string) => void;
  deshabilitado?: boolean;
}) {
  if (fotos.length === 0) return null;
  const sola = fotos.length === 1;

  return (
    <div className={sola ? "" : "grid grid-cols-2 gap-2 sm:grid-cols-3"}>
      {fotos.map((f, i) => (
        <figure
          key={f.id}
          className={`group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-950 ${
            sola ? "" : "aspect-square"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={f.url}
            alt=""
            className={
              sola
                ? "block h-auto max-h-80 w-full object-contain"
                : "absolute inset-0 h-full w-full object-cover"
            }
          />

          {!f.ruta && (
            <div className="absolute inset-0 flex flex-col justify-end bg-black/45 p-3">
              <div className="mb-1.5 flex items-center justify-between text-[11.5px] font-semibold text-white">
                <span>Subiendo…</span>
                <span className="tabular-nums">{Math.round(f.progreso * 100)}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Progreso de la subida"
                aria-valuenow={Math.round(f.progreso * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1.5 w-full overflow-hidden rounded-full bg-white/25"
              >
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-200 ease-out"
                  style={{ width: `${Math.max(4, f.progreso * 100)}%` }}
                />
              </div>
            </div>
          )}

          {f.ruta && i === 0 && fotos.length > 1 && (
            <figcaption className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              Portada
            </figcaption>
          )}

          <button
            type="button"
            onClick={() => onQuitar(f.id)}
            disabled={deshabilitado}
            aria-label="Quitar foto"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/85 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </figure>
      ))}
    </div>
  );
}
