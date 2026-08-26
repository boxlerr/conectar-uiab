"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronDown, Megaphone, RotateCcw, Sparkles } from "lucide-react";
import { llamarAccion, fallo } from "@/lib/accion-segura";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { resetearNovedad } from "../acciones";
import { CATALOGO_NOVEDADES, fechaNovedadLegible } from "../catalogo";
import {
  claveNovedad,
  NOVEDAD_EXIGE_FICHA,
  NOVEDADES_POR_PRIORIDAD,
  type NovedadId,
} from "../novedades";

/**
 * Las novedades del sistema, dentro del panel.
 *
 * EL PROBLEMA QUE ARREGLA
 *
 * Cada novedad se anunciaba con un cartel que aparece una vez y no vuelve
 * nunca: al que lo cerró de apuro —o al que entró por primera vez después de
 * que salió, porque `debeVerNovedad` no se lo muestra— el anuncio se le perdía
 * para siempre. No había ningún lugar en la app donde leer qué cambió.
 *
 * Acá están todas, siempre. El texto sale del mismo catálogo que usan los
 * carteles, así que no hay dos versiones que se desincronicen.
 *
 * POR QUÉ SÓLO SE VE EL RESUMEN
 *
 * La primera versión mostraba las tres novedades enteras —resumen, tres
 * cambios y la caja de avisos— y quedaba un muro de texto en el que no se leía
 * ninguna. Ahora arriba va lo que se entiende de un vistazo (qué cambió y en
 * qué se nota) y la letra chica queda detrás de "Ver detalle".
 */

/** Un acento por novedad: en tres tarjetas iguales no se distingue una de otra. */
const ACENTO: Record<NovedadId, { barra: string; chip: string; icono: string; halo: string }> = {
  panel_control: {
    barra: "from-emerald-400 to-teal-500",
    chip: "bg-emerald-50 text-emerald-700",
    icono: "bg-emerald-50 text-emerald-500",
    halo: "group-hover:border-emerald-200/70",
  },
  oportunidades_cartelera: {
    barra: "from-amber-400 to-orange-500",
    chip: "bg-amber-50 text-amber-700",
    icono: "bg-amber-50 text-amber-500",
    halo: "group-hover:border-amber-200/70",
  },
  perfil_directorio: {
    barra: "from-sky-400 to-blue-600",
    chip: "bg-sky-50 text-sky-700",
    icono: "bg-sky-50 text-sky-500",
    halo: "group-hover:border-sky-200/70",
  },
  usuarios_empresa: {
    barra: "from-violet-400 to-purple-600",
    chip: "bg-violet-50 text-violet-700",
    icono: "bg-violet-50 text-violet-500",
    halo: "group-hover:border-violet-200/70",
  },
};

const TONO_AVISO = {
  ambar: {
    caja: "border-amber-100 bg-amber-50/70",
    titulo: "text-amber-800",
    check: "text-amber-500",
    texto: "text-amber-900/75",
    pie: "text-amber-800/55",
  },
  verde: {
    caja: "border-emerald-100 bg-emerald-50/70",
    titulo: "text-emerald-700",
    check: "text-emerald-500",
    texto: "text-emerald-900/75",
    pie: "text-emerald-800/55",
  },
} as const;

interface FeedNovedadesProps {
  /** `true` si el usuario administra una ficha (empresa o prestador). */
  tieneFicha: boolean;
  /** `perfiles.tutoriales_vistos` tal cual vino del servidor. */
  vistas: Record<string, string | null>;
}

export function FeedNovedades({ tieneFicha, vistas }: FeedNovedadesProps) {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [abierta, setAbierta] = useState<NovedadId | null>(null);
  const [reseteando, setReseteando] = useState<NovedadId | null>(null);
  const [, startTransition] = useTransition();

  const ids = NOVEDADES_POR_PRIORIDAD.filter((id) => tieneFicha || !NOVEDAD_EXIGE_FICHA[id]);
  if (ids.length === 0) return null;

  /**
   * "Nueva" = todavía no la cerró. Se mira sólo el mapa de vistas y no
   * `debeVerNovedad`: a quien creó la cuenta después del anuncio, esa función
   * le devuelve `false` para no molestarlo con un cartel de algo que para él
   * siempre estuvo así. Pero acá el contenido igual le sirve, y marcarle todo
   * como "ya visto" sería mentirle.
   */
  const esNueva = (id: NovedadId) => !vistas[claveNovedad(id)];
  const sinLeer = ids.filter(esNueva).length;

  async function volverAVer(id: NovedadId) {
    setReseteando(id);
    const r = await llamarAccion(() => resetearNovedad(id));
    if (fallo(r)) {
      setReseteando(null);
      return;
    }
    // La pila de carteles lee del contexto de auth, así que hay que refrescarlo
    // para que vuelva a considerar esta novedad pendiente.
    await refreshUser();
    startTransition(() => router.refresh());
    setReseteando(null);
  }

  return (
    <section
      id="novedades"
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_2px_16px_-6px_rgba(0,33,63,0.06)]"
    >
      {/* Cabecera con una banda apenas teñida: separa el bloque del resto del
          panel sin meter otra línea divisoria. */}
      <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-r from-[#f5f8ff] via-white to-white px-5 py-5 sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-sky-200/25 blur-3xl"
        />
        <div className="relative flex items-center gap-4">
          <span className="relative hidden h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-slate-200/70 tab:block">
            <Image
              src="/panel/ilustracion-novedades.webp"
              alt=""
              width={220}
              height={220}
              className="h-full w-full object-cover"
              aria-hidden
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Megaphone className="h-[18px] w-[18px] shrink-0 text-[#2563eb] tab:hidden" strokeWidth={2.2} />
              <h2 className="font-poppins text-[15px] font-bold tracking-tight text-[#00213f]">
                Novedades del sistema
              </h2>
              {sinLeer > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#2563eb] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  {sinLeer} sin leer
                </span>
              )}
            </div>
            <p className="mt-1 text-[12.5px] leading-snug text-slate-400">
              Lo que fuimos cambiando en la plataforma. Quedan acá aunque ya hayas cerrado el cartel.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px bg-slate-100 tab:grid-cols-2 xl:grid-cols-4">
        {ids.map((id) => {
          const novedad = CATALOGO_NOVEDADES[id];
          const acento = ACENTO[id];
          const nueva = esNueva(id);
          const desplegada = abierta === id;
          const tono = TONO_AVISO[novedad.aviso.tono];

          return (
            <article key={id} className={`group relative flex flex-col bg-white`}>
              {/* Barra de acento: es lo que hace que las tres tarjetas se
                  distingan a un metro de distancia. */}
              <span
                aria-hidden
                className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${acento.barra}`}
              />

              <div className="flex flex-1 flex-col p-5 pt-6 sm:p-6 sm:pt-7">
                <div className="mb-2.5 flex items-center gap-2">
                  <time
                    dateTime={novedad.fecha}
                    className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em] ${acento.chip}`}
                  >
                    {fechaNovedadLegible(novedad.fecha)}
                  </time>
                  {nueva && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-black uppercase tracking-wider text-[#2563eb]">
                      <Sparkles className="h-3 w-3" />
                      Nueva
                    </span>
                  )}
                </div>

                <h3 className="font-poppins text-[16px] font-bold leading-snug tracking-tight text-[#00213f]">
                  {novedad.titulo}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{novedad.resumen}</p>

                <ul className="mt-4 space-y-2">
                  {novedad.cambios.map((cambio) => (
                    <li key={cambio.titulo} className="flex items-start gap-2.5">
                      <span
                        className={`mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md ${acento.icono}`}
                      >
                        <cambio.icono className="h-3 w-3" strokeWidth={2.2} />
                      </span>
                      <span className="text-[12.5px] leading-snug text-slate-500">
                        <span className="font-bold text-[#00213f]">{cambio.titulo}.</span>{" "}
                        {cambio.texto}
                      </span>
                    </li>
                  ))}
                </ul>

                {desplegada && (
                  <div className={`mt-4 rounded-xl border p-3.5 ${tono.caja}`}>
                    <p
                      className={`mb-2 text-[10.5px] font-bold uppercase tracking-[0.1em] ${tono.titulo}`}
                    >
                      {novedad.aviso.titulo}
                    </p>
                    <ul className="space-y-1.5">
                      {novedad.aviso.items.map((texto) => (
                        <li
                          key={texto}
                          className={`flex items-start gap-2 text-[12px] ${tono.texto}`}
                        >
                          <Check className={`mt-[3px] h-3 w-3 shrink-0 ${tono.check}`} />
                          <span className="leading-snug">{texto}</span>
                        </li>
                      ))}
                    </ul>
                    {novedad.aviso.pie && (
                      <p className={`mt-2.5 text-[11px] leading-snug ${tono.pie}`}>
                        {novedad.aviso.pie}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                  <Link
                    href={novedad.cta.href}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#f2f5f8] px-3 py-2 text-[12.5px] font-bold text-[#00213f] transition-colors hover:bg-[#00213f] hover:text-white"
                  >
                    {novedad.cta.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <div className="flex shrink-0 items-center gap-0.5">
                    {/* Reabrir el cartel es una acción de rincón: va como ícono
                        con tooltip y no como un tercer link de texto, que era
                        lo que amontonaba el pie de la tarjeta. */}
                    {!nueva && (
                      <button
                        type="button"
                        onClick={() => volverAVer(id)}
                        disabled={reseteando === id}
                        title="Volver a mostrar el cartel completo la próxima vez que entres"
                        aria-label="Volver a ver el cartel"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-slate-50 hover:text-[#00213f] disabled:opacity-40"
                      >
                        <RotateCcw className={`h-3.5 w-3.5 ${reseteando === id ? "animate-spin" : ""}`} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setAbierta(desplegada ? null : id)}
                      aria-expanded={desplegada}
                      className="flex items-center gap-1 rounded-lg px-2 py-2 text-[12px] font-semibold text-slate-400 transition-colors hover:bg-slate-50 hover:text-[#00213f]"
                    >
                      {desplegada ? "Menos" : "Detalle"}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${desplegada ? "rotate-180" : ""}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
