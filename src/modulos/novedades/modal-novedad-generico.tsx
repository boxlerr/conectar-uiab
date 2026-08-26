"use client";

import Image from "next/image";
import { Check, X } from "lucide-react";
import { PieNovedad, type PropsNovedad } from "./pie-novedad";
import { CATALOGO_NOVEDADES } from "./catalogo";
import type { NovedadId } from "./novedades";

/**
 * Cartel de novedad armado directamente desde el catálogo.
 *
 * Los tres primeros carteles se escribieron uno por uno, cada uno con su
 * maqueta dibujada a mano (la tarjeta falsa de oportunidad, la cabecera falsa
 * de ficha, los dos usuarios de ejemplo). Eso está bien cuando lo que se
 * anuncia se entiende mejor viéndolo, pero obliga a escribir un componente
 * nuevo por cada anuncio.
 *
 * Este es el molde para los que vienen: recibe un `NovedadId`, lee el contenido
 * del catálogo y arma el cartel. El chrome —overlay, panel de marca, foco,
 * navegación de la pila— es el mismo que el de los otros tres.
 */

const TONO = {
  ambar: {
    caja: "border-amber-100 bg-amber-50/60",
    titulo: "text-amber-800",
    check: "text-amber-600",
    texto: "text-amber-900/80",
    pie: "text-amber-800/60",
  },
  verde: {
    caja: "border-emerald-100 bg-emerald-50/60",
    titulo: "text-emerald-700",
    check: "text-emerald-600",
    texto: "text-emerald-900/80",
    pie: "text-emerald-800/60",
  },
} as const;

interface Props extends PropsNovedad {
  id: NovedadId;
  /** Ilustración de la columna derecha. Se oculta abajo de `md`. */
  imagen?: { src: string; alt?: string };
}

export function ModalNovedadGenerico({ id, imagen, ...props }: Props) {
  const { titulo, resumen, cambios, aviso, cta } = CATALOGO_NOVEDADES[id];
  const tono = TONO[aviso.tono];
  const cerrar = props.onCerrar;
  const idTitulo = `novedad-${id}-titulo`;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in duration-200 fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitulo}
    >
      <div className="relative max-h-[90svh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in duration-200 zoom-in-95 md:grid md:max-w-[900px] md:grid-cols-[minmax(0,340px)_minmax(0,1fr)] md:items-stretch md:overflow-visible">
        {/* ── Panel de marca ── */}
        <div
          className="relative overflow-hidden rounded-t-2xl px-6 pb-6 pt-7 sm:px-8 md:flex md:flex-col md:justify-center md:rounded-l-2xl md:rounded-t-none md:py-9"
          style={{ background: "linear-gradient(135deg, #00213f 0%, #10375c 100%)" }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div aria-hidden className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-sky-400/10 blur-[80px]" />

          <button
            onClick={cerrar}
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white md:hidden"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/50 sm:text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              Novedad — UIAB Conecta
            </span>
            <h2
              id={idTitulo}
              className="mt-2 text-2xl font-bold leading-tight tracking-tight text-white md:text-[28px]"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              {titulo}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">{resumen}</p>

            <ul className="mt-7 hidden space-y-3 md:block">
              {cambios.map(({ icono: Icono, titulo: t, texto }) => (
                <li key={t} className="flex items-start gap-2.5 text-[13px] text-white/75">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/10 text-sky-300">
                    <Icono className="h-3 w-3" />
                  </span>
                  <span className="leading-snug">
                    <strong className="font-semibold text-white/90">{t}.</strong> {texto}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Columna derecha ── */}
        <div className="relative px-6 pt-6 sm:px-8 md:py-9 md:pr-8">
          <button
            onClick={cerrar}
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-10 hidden h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 md:flex"
          >
            <X className="h-4 w-4" />
          </button>

          {imagen && (
            <div className="mb-5 hidden overflow-hidden rounded-xl ring-1 ring-slate-200/70 md:block">
              <Image
                src={imagen.src}
                alt={imagen.alt ?? ""}
                width={440}
                height={440}
                className="h-32 w-full object-cover"
              />
            </div>
          )}

          {/* En una sola columna los bullets van acá; en dos columnas ya están
              sobre el panel navy y este bloque desaparece. */}
          <ul className="space-y-2 md:hidden">
            {cambios.map(({ icono: Icono, titulo: t, texto }) => (
              <li key={t} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
                  <Icono className="h-3 w-3" />
                </span>
                <span className="leading-snug">
                  <strong className="font-semibold text-slate-800">{t}.</strong> {texto}
                </span>
              </li>
            ))}
          </ul>

          <div className={`mt-4 rounded-xl border p-4 md:mt-0 ${tono.caja}`}>
            <p className={`mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] ${tono.titulo}`}>
              {aviso.titulo}
            </p>
            <ul className="space-y-1.5">
              {aviso.items.map((texto) => (
                <li key={texto} className={`flex items-start gap-2 text-[13px] ${tono.texto}`}>
                  <Check className={`mt-[3px] h-3.5 w-3.5 shrink-0 ${tono.check}`} />
                  <span className="leading-snug">{texto}</span>
                </li>
              ))}
            </ul>
            {aviso.pie && (
              <p className={`mt-3 text-[11px] leading-snug ${tono.pie}`}>{aviso.pie}</p>
            )}
          </div>

          <PieNovedad {...props} cta={cta} />
        </div>
      </div>
    </div>
  );
}
