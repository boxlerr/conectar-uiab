"use client";

import { X, Check } from "lucide-react";
import { CATALOGO_NOVEDADES } from "./catalogo";
import { PieNovedad, type PropsNovedad } from "./pie-novedad";

/**
 * Cartel de novedad: "ahora podés dar acceso a tu equipo".
 *
 * Quién lo ve y cuándo NO se decide acá: lo maneja `pila-novedades.tsx`, que
 * junta los carteles pendientes, los muestra de a uno con Siguiente / Atrás y
 * los marca en `perfiles.tutoriales_vistos` (nunca en localStorage: si no,
 * volvería a aparecer en cada dispositivo y en cada navegador). Este archivo es
 * sólo el contenido.
 */

/**
 * El texto sale del catálogo compartido: el mismo que lee la sección
 * "Novedades" del panel de control.
 *
 * De paso se termina una duplicación vieja: los bullets estaban escritos DOS
 * veces con redacciones distintas (una para el layout de una columna y otra
 * para el de dos). Ahora las dos listas leen la misma, la larga, que es la que
 * se entiende sola.
 */
const { titulo: TITULO, resumen: RESUMEN, cambios: CAMBIOS, aviso: AVISO, cta: CTA } =
  CATALOGO_NOVEDADES.usuarios_empresa;

export function ModalNovedadUsuarios(props: PropsNovedad) {
  const cerrar = props.onCerrar;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="novedad-titulo"
    >
      {/*
        Layout en DOS COLUMNAS: la marca a la izquierda y el contenido a la
        derecha. En vertical el cartel medía casi el alto completo de la pantalla
        y en un notebook quedaba cortado; a lo ancho entra cómodo y sobra aire.
        Abajo de `md` se apila, que en mobile es lo único que funciona.
      */}
      <div className="relative w-full max-w-[560px] md:max-w-[900px] max-h-[90svh] overflow-y-auto md:overflow-visible bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 md:grid md:grid-cols-[minmax(0,340px)_minmax(0,1fr)] md:items-stretch">
        {/* ── Panel de marca: mismo gradiente y trama que el login ── */}
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
              id="novedad-titulo"
              className="text-2xl md:text-[28px] font-bold text-white tracking-tight leading-tight mt-2"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              {TITULO}
            </h2>
            <p className="text-sm text-white/70 mt-3 max-w-md leading-relaxed">
              {RESUMEN}
            </p>

            {/* En dos columnas los bullets viven acá: equilibran el alto de las
                dos mitades y dejan la derecha para lo accionable. */}
            <ul className="hidden md:block mt-7 space-y-3">
              {CAMBIOS.map(({ icono: Icon, texto }, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] text-white/75">
                  <span className="w-5 h-5 rounded-md bg-white/10 text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3 h-3" />
                  </span>
                  <span className="leading-snug">{texto}</span>
                </li>
              ))}
            </ul>
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

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
            {[
              { inicial: "E", nombre: "Evelyn G.", area: "Compras", mail: "compras@tuempresa.com.ar" },
              { inicial: "M", nombre: "Martín D.", area: "Mantenimiento", mail: "manto@tuempresa.com.ar" },
            ].map((p) => (
              <div
                key={p.inicial}
                className="flex items-center gap-3 rounded-lg bg-white border border-slate-200 px-3 py-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 border border-primary-100 flex items-center justify-center text-xs font-bold shrink-0">
                  {p.inicial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-slate-800 leading-tight truncate">
                    {p.nombre}
                    <span className="ml-2 text-[11px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {p.area}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{p.mail}</p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 shrink-0">
                  <Check className="w-3 h-3" />
                  Activo
                </span>
              </div>
            ))}
          </div>

          {/* En una sola columna (mobile) los bullets van acá; en dos columnas
              se muestran sobre el panel navy y este bloque desaparece. */}
          <ul className="mt-4 space-y-2 md:hidden">
            {CAMBIOS.map(({ icono: Icon, texto }, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                <span className="w-5 h-5 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3 h-3" />
                </span>
                {texto}
              </li>
            ))}
          </ul>

          {/* ── Errores reportados por las socias y ya corregidos ──
              Se listan acá y no en un cartel aparte para no encadenar dos
              modales. Sólo van los que la socia sufrió en primera persona: los
              arreglos internos del panel de admin no le dicen nada. */}
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700 mb-2.5">
              {AVISO.titulo}
            </p>
            <ul className="space-y-1.5">
              {AVISO.items.map((texto, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-emerald-900/80">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-[3px]" />
                  <span className="leading-snug">{texto}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-emerald-800/60 mt-3 leading-snug">
              {AVISO.pie}
            </p>
          </div>

          {/* Los botones viven dentro de la columna derecha: si quedaran fuera
              de la grilla se irían al ancho completo, debajo del panel navy. */}
          <PieNovedad {...props} cta={CTA} />
        </div>
      </div>
    </div>
  );
}
