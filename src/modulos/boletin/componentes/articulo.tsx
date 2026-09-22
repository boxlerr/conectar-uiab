"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Pin } from "lucide-react";
import { bloquesDeCuerpo, fechaLegible } from "../formato";
import type { ComunicadoPublico } from "../tipos";
import { CarruselFotos } from "./carrusel-fotos";
import { CompartirNota } from "./compartir-nota";
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
 * ANCHO Y MEDIDA DE LECTURA
 *
 * La hoja la dimensiona la página (`/boletin/[slug]` la pone en una grilla de
 * tres columnas, con el compartir a la izquierda y las otras notas a la
 * derecha). Acá adentro lo único que se cuida es la MEDIDA: el cuerpo no pasa
 * de ~70 caracteres por línea porque más ancho se lee peor, no mejor. Ensanchar
 * la columna de texto no es "aprovechar el espacio": para eso están los
 * costados.
 *
 * `vistaPrevia` la dibuja en el editor del panel de admin: sin menú de admin
 * ni botones de compartir (la publicación todavía no existe).
 */

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
  const [visor, setVisor] = useState<number | null>(null);
  const cerrarVisor = useCallback(() => setVisor(null), []);

  // La bajada es un campo, no el primer párrafo: antes se agrandaba solo y no
  // había forma de ponerlo a propósito ni de evitarlo.
  const bajada = c.bajada?.trim() || null;
  const bloques = bloquesDeCuerpo(c.cuerpo);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_2px_16px_-6px_rgba(0,33,63,0.08)]">
      <div className="px-5 pt-7 sm:px-10 sm:pt-11 lg:px-14">
        <div className="mb-4 flex items-center gap-3 text-[11.5px] font-bold uppercase tracking-[0.12em]">
          <span className="text-sky-700">Boletín UIAB</span>
          {c.fijado && (
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Pin className="h-3 w-3" /> Fijada
            </span>
          )}
        </div>

        {c.titulo && (
          <h1 className="font-poppins text-[2rem] font-bold leading-[1.12] tracking-tight text-[#00213f] sm:text-[2.6rem]">
            {c.titulo}
          </h1>
        )}
        {bajada && (
          <p className="mt-5 max-w-[46ch] whitespace-pre-line text-[1.15rem] leading-[1.6] text-slate-600 sm:text-[1.3rem]">
            {bajada}
          </p>
        )}

        {/* Firma, fecha y acciones */}
        <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-slate-100 pt-5">
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
            <div className="flex items-center gap-1.5">
              {/* En xl el compartir vive en la columna pegajosa de la izquierda;
                  acá abajo no hay costado, así que va en línea. */}
              <div className="xl:hidden">
                <CompartirNota c={c} />
              </div>
              {esAdmin && <MenuAdmin c={c} volverAlFeed />}
            </div>
          )}
        </div>
      </div>

      {c.imagenes.length > 0 && (
        <figure className="mt-7 px-0 sm:px-10 lg:px-14">
          <div className="overflow-hidden sm:rounded-xl">
            <CarruselFotos
              imagenes={c.imagenes}
              alto="aspect-[16/10]"
              sizes="(max-width: 768px) 100vw, 720px"
              prioridad={!vistaPrevia}
              alAbrir={vistaPrevia ? undefined : (i) => setVisor(i)}
            />
          </div>
          {visor !== null && <VisorFoto c={c} desde={visor} onCerrar={cerrarVisor} />}
        </figure>
      )}

      {/* El cuerpo: medida acotada aunque la hoja sea ancha. */}
      <div className="px-5 pb-8 pt-7 sm:px-10 lg:px-14">
        {bloques.map((b, i) =>
          b.tipo === "subtitulo" ? (
            // <h2> de verdad, no un párrafo en negrita: es la estructura que
            // lee un lector de pantalla y la que Google usa para entender de
            // qué habla cada tramo de la nota.
            <h2
              key={i}
              className="mb-3 mt-9 max-w-[68ch] font-poppins text-[1.35rem] font-bold leading-snug tracking-tight text-[#00213f] first:mt-0 sm:text-[1.5rem]"
            >
              {b.texto}
            </h2>
          ) : (
            <p
              key={i}
              className="mb-5 max-w-[68ch] whitespace-pre-line break-words text-[17.5px] leading-[1.78] text-slate-800 last:mb-0"
            >
              {b.texto}
            </p>
          )
        )}
      </div>

      {!vistaPrevia && (
        <footer className="mt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/60 px-5 py-5 sm:px-10 lg:px-14">
          <p className="text-[13px] leading-snug text-slate-500">
            Publicado por la{" "}
            <Link href="/nosotros" className="font-semibold text-[#00213f] hover:text-sky-700">
              Unión Industrial de Almirante Brown
            </Link>
            .
          </p>
          <CompartirNota c={c} />
        </footer>
      )}
    </article>
  );
}
