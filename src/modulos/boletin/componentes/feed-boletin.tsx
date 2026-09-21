import Link from "next/link";
import { ArrowRight, Megaphone, Pin } from "lucide-react";
import type { ComunicadoPublico } from "../tipos";
import { fechaLegible, rutaComunicado } from "../formato";
import { FotoComunicado } from "./foto-comunicado";

/**
 * El Boletín UIAB dentro del panel: los últimos comunicados que publicó la UIAB.
 *
 * Es un bloque APARTE de "Novedades del sistema" (ese es el changelog de la
 * plataforma). Acá va contenido editorial —noticias, avisos, fotos— que se
 * carga desde /admin/boletin. Muestra unos pocos y manda a /boletin por el
 * resto. Si no hay nada publicado, no dibuja nada (no deja un cajón vacío).
 */

/**
 * Columnas según cuántos haya: con uno solo la tarjeta va horizontal a lo
 * ancho (foto | texto); con 3 columnas fijas quedaba en un tercio y el resto
 * del bloque vacío.
 */
const COLUMNAS: Record<number, string> = {
  1: "",
  2: "tab:grid-cols-2",
  3: "tab:grid-cols-3",
};

export function FeedBoletin({ comunicados }: { comunicados: ComunicadoPublico[] }) {
  if (comunicados.length === 0) return null;
  const solo = comunicados.length === 1;

  return (
    <section
      id="boletin"
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_2px_16px_-6px_rgba(0,33,63,0.06)]"
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-[#f5f8ff] via-white to-white px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Megaphone className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <h2 className="font-poppins text-[15px] font-bold tracking-tight text-[#00213f]">
              Boletín UIAB
            </h2>
            <p className="mt-0.5 text-[12.5px] leading-snug text-slate-400">
              Noticias y avisos de la Unión Industrial.
            </p>
          </div>
        </div>
        <Link
          href="/boletin"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#f2f5f8] px-3 py-2 text-[12.5px] font-bold text-[#00213f] transition-colors hover:bg-[#00213f] hover:text-white"
        >
          Ver todo
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className={`grid grid-cols-1 gap-px bg-slate-100 ${COLUMNAS[comunicados.length] ?? COLUMNAS[3]}`}>
        {comunicados.map((c) => (
          <Link
            key={c.id}
            href={rutaComunicado(c.id)}
            className={`group flex flex-col bg-white transition-colors hover:bg-slate-50/60 ${
              solo && c.imagenUrl ? "tab:grid tab:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]" : ""
            }`}
          >
            {c.imagenUrl && (
              <FotoComunicado
                src={c.imagenUrl}
                sizes={solo ? "(max-width: 768px) 100vw, 480px" : "(max-width: 768px) 100vw, 33vw"}
                className={solo ? "h-40 w-full tab:h-full tab:min-h-52" : "h-40 w-full"}
              />
            )}
            <div className={`flex flex-1 flex-col p-5 ${solo ? "tab:justify-center tab:p-7" : ""}`}>
              <div className="mb-2 flex items-center gap-2">
                <time
                  dateTime={c.publicado_en ?? undefined}
                  className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-400"
                >
                  {fechaLegible(c.publicado_en)}
                </time>
                {c.fijado && (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-black uppercase tracking-wider text-sky-600">
                    <Pin className="h-3 w-3" /> Fijado
                  </span>
                )}
              </div>
              {c.titulo && (
                <h3 className="mb-2 font-poppins text-[15px] font-bold leading-snug tracking-tight text-[#00213f]">
                  {c.titulo}
                </h3>
              )}
              <p className="line-clamp-3 text-[13px] leading-relaxed text-slate-500 whitespace-pre-line">
                {c.cuerpo}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-sky-700">
                Leer más
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
