import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Megaphone, Pin } from "lucide-react";
import type { ComunicadoPublico } from "../tipos";

/**
 * El Boletín UIAB dentro del panel: los últimos comunicados que publicó la UIAB.
 *
 * Es un bloque APARTE de "Novedades del sistema" (ese es el changelog de la
 * plataforma). Acá va contenido editorial —noticias, avisos, fotos— que se
 * carga desde /admin/boletin. Muestra unos pocos y manda a /boletin por el
 * resto. Si no hay nada publicado, no dibuja nada (no deja un cajón vacío).
 */

function fechaLegible(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function FeedBoletin({ comunicados }: { comunicados: ComunicadoPublico[] }) {
  if (comunicados.length === 0) return null;

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

      <div className="grid grid-cols-1 gap-px bg-slate-100 tab:grid-cols-3">
        {comunicados.map((c) => (
          <Link
            key={c.id}
            href="/boletin"
            className="group flex flex-col bg-white transition-colors hover:bg-slate-50/60"
          >
            {c.imagenUrl && (
              <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                <Image
                  src={c.imagenUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col p-5">
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
              <h3 className="font-poppins text-[15px] font-bold leading-snug tracking-tight text-[#00213f]">
                {c.titulo}
              </h3>
              <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-slate-500 whitespace-pre-line">
                {c.cuerpo}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
