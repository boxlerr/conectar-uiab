"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight, X, Check, Building2, SlidersHorizontal, CalendarClock, Sparkles, MapPin, Tag,
} from "lucide-react";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { marcarNovedadVista } from "./acciones";
import { novedadPendiente } from "./novedades";
import { llamarAccion, fallo } from "@/lib/accion-segura";

/**
 * Cartel de novedad: "rediseñamos la cartelera de oportunidades".
 *
 * Mismo mecanismo que los otros dos — se muestra una sola vez, se marca en
 * `perfiles.tutoriales_vistos` y no le sale a quien creó la cuenta después del
 * cambio, porque para esa persona la cartelera siempre fue así.
 *
 * A DIFERENCIA del cartel de la ficha, este NO exige tener ficha propia: la
 * cartelera le sirve tanto a la socia que publica un pedido como a la que lo
 * responde, así que le corresponde a cualquiera que entre con sesión.
 *
 * Sólo se muestra si es LA novedad que toca: `novedadPendiente` elige una sola
 * cuando corresponden varias. Dos modales encimados no se pueden cerrar.
 */

const RUTAS_SIN_CARTEL = [
  "/login",
  "/register",
  "/recovery",
  "/restablecer-password",
  "/definir-password",
  "/completar-cuenta",
  "/suscripcion/checkout",
];

/** Lo que cambió de verdad en la cartelera. Nada de esto es promesa a futuro. */
const CAMBIOS = [
  {
    icon: Building2,
    titulo: "Se ve quién publica",
    texto: "Cada pedido lleva el logo de la empresa que lo publicó, no sólo el nombre.",
  },
  {
    icon: SlidersHorizontal,
    titulo: "Filtros y orden",
    texto: "Buscá por rubro, ubicación o antigüedad, y ordená la lista como te sirva.",
  },
  {
    icon: CalendarClock,
    titulo: "Los datos duros, afuera",
    texto: "Cantidad, localidad y fecha de necesidad se leen sin abrir el pedido.",
  },
];

export function ModalNovedadOportunidades() {
  const { currentUser, refreshUser } = useAuth();
  const pathname = usePathname();
  const [cerrado, setCerrado] = useState(false);

  const leToca = novedadPendiente(currentUser) === "oportunidades_cartelera";
  const enRutaDeAcceso = RUTAS_SIN_CARTEL.some((r) => pathname.startsWith(r));

  if (!currentUser || !leToca || cerrado || enRutaDeAcceso) return null;

  async function cerrar() {
    setCerrado(true);
    const r = await llamarAccion(() => marcarNovedadVista("oportunidades_cartelera"));
    if (!fallo(r) && r.ok) refreshUser();
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="novedad-oportunidades-titulo"
    >
      <div className="relative w-full max-w-[560px] md:max-w-[900px] max-h-[90svh] overflow-y-auto md:overflow-visible bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 md:grid md:grid-cols-[minmax(0,340px)_minmax(0,1fr)] md:items-stretch">
        {/* ── Panel de marca ── */}
        <div
          className="relative px-6 sm:px-8 pt-7 pb-6 md:py-9 overflow-hidden rounded-t-2xl md:rounded-t-none md:rounded-l-2xl md:flex md:flex-col md:justify-center"
          style={{ background: "linear-gradient(135deg, #00213f 0%, #10375c 100%)" }}
        >
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute -top-24 -right-16 w-64 h-64 rounded-full bg-sky-400/10 blur-[80px]" />

          <button
            onClick={cerrar}
            aria-label="Cerrar"
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition md:hidden"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 text-[11px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Novedad — UIAB Conecta
            </span>
            <h2
              id="novedad-oportunidades-titulo"
              className="text-2xl md:text-[28px] font-bold text-white tracking-tight leading-tight mt-2"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Rediseñamos la cartelera de oportunidades
            </h2>
            <p className="text-sm text-white/70 mt-3 max-w-md leading-relaxed">
              Es donde las socias publican lo que necesitan comprar o contratar. Ahora se lee
              de un vistazo: quién lo pide, de qué rubro es y para cuándo lo necesita.
            </p>

            {/* La misma ilustración que ahora encabeza /oportunidades: el cartel
                y la página que anuncia tienen que verse como la misma cosa. */}
            <Image
              src="/landing/oportunidades-hero.webp"
              alt=""
              aria-hidden="true"
              width={900}
              height={760}
              className="hidden md:block w-[190px] h-auto mt-6 -ml-2 select-none"
            />
          </div>
        </div>

        {/* ── Columna derecha ── */}
        <div className="relative px-6 sm:px-8 pt-6 md:py-9 md:pr-8">
          <button
            onClick={cerrar}
            aria-label="Cerrar"
            className="hidden md:flex absolute top-4 right-4 z-10 w-8 h-8 rounded-full items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Maqueta chiquita de la tarjeta nueva: se entiende mejor viéndola que
              leyendo tres bullets sobre logos y chips. */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="rounded-lg bg-white border border-slate-200 p-3 flex gap-3">
              <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-sm font-black text-white bg-gradient-to-br from-primary-500 to-[#00213f]">
                A
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Abierta
                  </span>
                  <span className="ml-auto text-[10px] font-semibold text-slate-400">Hace 2 días</span>
                </div>
                <p className="text-[13px] font-bold text-[#00213f] leading-snug mt-0.5 truncate">
                  Provisión de tableros eléctricos
                </p>
                <p className="text-[11px] font-semibold text-slate-500">Empresa socia S.A.</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { icon: Tag, t: "Electricidad" },
                    { icon: MapPin, t: "Burzaco" },
                    { icon: CalendarClock, t: "Para el 30 sep" },
                  ].map(({ icon: Icon, t }) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200/70"
                    >
                      <Icon className="w-2.5 h-2.5 text-slate-400" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 px-0.5 leading-snug">
              Así se ve ahora cada pedido en la lista. El logo sale de la ficha de quien publica.
            </p>
          </div>

          {/* En una sola columna los bullets van acá. */}
          <ul className="mt-4 space-y-2">
            {CAMBIOS.map(({ icon: Icon, titulo, texto }) => (
              <li key={titulo} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                <span className="w-5 h-5 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3 h-3" />
                </span>
                <span className="leading-snug">
                  <strong className="text-slate-800 font-semibold">{titulo}.</strong> {texto}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-800 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Conviene que lo sepas
            </p>
            <ul className="space-y-1.5">
              {[
                "El logo que se muestra es el de tu ficha: si no cargaste uno, aparece la inicial.",
                "Publicar un pedido no tiene costo adicional y las respuestas van directo a tu empresa.",
                "Al publicarlo, la plataforma te sugiere las socias afines por rubro y etiquetas.",
              ].map((texto, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-amber-900/80">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-[3px]" />
                  <span className="leading-snug">{texto}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:items-center gap-2 pt-5 pb-6 md:pb-0">
            <button
              onClick={cerrar}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              Después
            </button>
            <Link
              href="/oportunidades"
              onClick={cerrar}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition"
            >
              Ver la cartelera
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
