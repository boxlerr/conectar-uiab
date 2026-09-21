"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { BadgeCheck, Link2, Pin } from "lucide-react";
import { toast } from "sonner";
import { fechaLegible, rutaComunicado } from "../formato";
import type { ComunicadoPublico } from "../tipos";
import { MenuAdmin } from "./publicacion";
import { VisorFoto } from "./visor-foto";

/**
 * Una publicación del Boletín leída entera, en formato de nota (diario / blog):
 * título grande, la bajada, quién y cuándo, la foto principal y el cuerpo con
 * tipografía cómoda para leer.
 *
 * El texto es plano: una línea en blanco separa párrafos. Si hay título y más
 * de un párrafo, el primero se destaca como bajada — así una nota se "arma"
 * sin editor enriquecido ni columnas nuevas en la base.
 *
 * `vistaPrevia` la dibuja en el editor del panel de admin: sin menú de admin
 * ni botón de copiar enlace (la publicación todavía no existe).
 */

export function parrafos(texto: string): string[] {
  return texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function contarPalabras(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

export function minutosDeLectura(texto: string): number {
  return Math.max(1, Math.round(contarPalabras(texto) / 200));
}

export function Articulo({
  c,
  esAdmin = false,
  vistaPrevia = false,
}: {
  c: ComunicadoPublico;
  esAdmin?: boolean;
  vistaPrevia?: boolean;
}) {
  const [visor, setVisor] = useState(false);
  const cerrarVisor = useCallback(() => setVisor(false), []);

  const todos = parrafos(c.cuerpo);
  const conBajada = Boolean(c.titulo) && todos.length > 1;
  const bajada = conBajada ? todos[0] : null;
  const cuerpo = conBajada ? todos.slice(1) : todos;

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${rutaComunicado(c.id)}`);
      toast.success("Enlace copiado. Pegalo donde quieras compartirlo.");
    } catch {
      toast.error("No pudimos copiar el enlace.");
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_2px_16px_-6px_rgba(0,33,63,0.08)]">
      <div className="px-5 pt-7 sm:px-10 sm:pt-10">
        <div className="mb-4 flex items-center gap-3 text-[11.5px] font-bold uppercase tracking-[0.12em]">
          <span className="text-sky-700">Boletín UIAB</span>
          {c.fijado && (
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Pin className="h-3 w-3" /> Fijada
            </span>
          )}
        </div>

        {c.titulo && (
          <h1 className="font-poppins text-[1.9rem] font-bold leading-[1.15] tracking-tight text-[#00213f] sm:text-[2.5rem]">
            {c.titulo}
          </h1>
        )}
        {bajada && (
          <p className="mt-4 whitespace-pre-line text-[1.15rem] leading-relaxed text-slate-600 sm:text-[1.25rem]">
            {bajada}
          </p>
        )}

        {/* Autor, fecha y acciones */}
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-y border-slate-100 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
              <Image src="/icono-uiab.svg" alt="" width={30} height={30} />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1">
                <span className="font-poppins text-[15px] font-bold text-[#00213f]">UIAB</span>
                <BadgeCheck className="h-4 w-4 fill-sky-500 text-white" aria-label="Cuenta oficial" />
              </div>
              <div className="mt-0.5 text-[13px] text-slate-500">
                <time dateTime={c.publicado_en ?? undefined}>
                  {fechaLegible(c.publicado_en) || "Sin publicar"}
                </time>
                {" · "}
                {minutosDeLectura(c.cuerpo)} min de lectura
              </div>
            </div>
          </div>
          {!vistaPrevia && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={copiarEnlace}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <Link2 className="h-4 w-4" />
                Copiar enlace
              </button>
              {esAdmin && <MenuAdmin c={c} volverAlFeed />}
            </div>
          )}
        </div>
      </div>

      {c.imagenUrl && (
        <div className="mt-6 px-0 sm:px-10">
          <button
            type="button"
            onClick={() => setVisor(true)}
            aria-label="Ver foto en grande"
            className="block w-full cursor-zoom-in overflow-hidden bg-slate-950 sm:rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <Image
              src={c.imagenUrl}
              alt={c.titulo || "Foto de la publicación"}
              width={0}
              height={0}
              sizes="(max-width: 768px) 100vw, 720px"
              priority={!vistaPrevia}
              className="block h-auto max-h-[36rem] w-full object-contain"
            />
          </button>
          {visor && <VisorFoto c={c} onCerrar={cerrarVisor} />}
        </div>
      )}

      <div className="space-y-5 px-5 pb-10 pt-6 sm:px-10 sm:pt-8">
        {cuerpo.map((p, i) => (
          <p
            key={i}
            className="whitespace-pre-line break-words text-[17px] leading-[1.75] text-slate-800"
          >
            {p}
          </p>
        ))}
      </div>
    </article>
  );
}
