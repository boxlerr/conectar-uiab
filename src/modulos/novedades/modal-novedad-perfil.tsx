"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight, X, Check, BadgeCheck, Phone, LayoutGrid, Sparkles,
} from "lucide-react";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { tipoEntidadDe } from "@/modulos/autenticacion/entidad-del-perfil";
import { marcarNovedadVista } from "./acciones";
import { novedadPendiente } from "./novedades";
import { llamarAccion, fallo } from "@/lib/accion-segura";

/**
 * Cartel de novedad: "tu ficha del directorio se rediseñó".
 *
 * Mismo mecanismo que el de usuarios — se muestra una sola vez, se marca en
 * `perfiles.tutoriales_vistos` y no le sale a quien creó la cuenta después del
 * cambio, porque para esa persona la ficha siempre fue así.
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

/** Lo que cambió de verdad en la ficha. Nada de esto es promesa a futuro. */
const CAMBIOS = [
  {
    icon: BadgeCheck,
    titulo: "Sello de verificada",
    texto: "Se ve de entrada que la ficha es la cuenta real de tu empresa, no una copia.",
  },
  {
    icon: Phone,
    titulo: "El contacto, arriba de todo",
    texto: "Teléfono, correo y dirección dejaron de estar al final del scroll.",
  },
  {
    icon: LayoutGrid,
    titulo: "Tu catálogo de un vistazo",
    texto: "Los productos entran en pantalla y la foto grande se abre con un click.",
  },
];

export function ModalNovedadPerfil() {
  const { currentUser, refreshUser } = useAuth();
  const pathname = usePathname();
  const [cerrado, setCerrado] = useState(false);

  const leToca = novedadPendiente(currentUser) === "perfil_directorio";
  // Sólo a quien administra una ficha: es de quien hablamos.
  const tieneFicha = Boolean(tipoEntidadDe(currentUser));
  const enRutaDeAcceso = RUTAS_SIN_CARTEL.some((r) => pathname.startsWith(r));

  if (!currentUser || !tieneFicha || !leToca || cerrado || enRutaDeAcceso) return null;

  async function cerrar() {
    setCerrado(true);
    const r = await llamarAccion(() => marcarNovedadVista("perfil_directorio"));
    if (!fallo(r) && r.ok) refreshUser();
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="novedad-perfil-titulo"
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
              id="novedad-perfil-titulo"
              className="text-2xl md:text-[28px] font-bold text-white tracking-tight leading-tight mt-2"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Rediseñamos tu ficha del directorio
            </h2>
            <p className="text-sm text-white/70 mt-3 max-w-md leading-relaxed">
              Es la página que ven las otras empresas cuando te buscan. Ahora se entiende de
              una: quién sos, cómo contactarte y qué vendés, sin bajar media pantalla.
            </p>

            <ul className="hidden md:block mt-7 space-y-3">
              {CAMBIOS.map(({ icon: Icon, titulo, texto }) => (
                <li key={titulo} className="flex items-start gap-2.5 text-[13px] text-white/75">
                  <span className="w-5 h-5 rounded-md bg-white/10 text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3 h-3" />
                  </span>
                  <span className="leading-snug">
                    <strong className="text-white/90 font-semibold">{titulo}.</strong> {texto}
                  </span>
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

          {/* Maqueta chiquita de la cabecera nueva: se entiende mejor viéndola
              que leyendo tres bullets sobre márgenes y tipografías. */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="rounded-lg bg-white border border-slate-200 overflow-hidden">
              <div
                className="px-3 py-3 flex items-center gap-3"
                style={{ background: "linear-gradient(135deg, #00213f 0%, #10375c 100%)" }}
              >
                <div className="w-10 h-10 rounded-lg bg-white/95 flex items-center justify-center text-[10px] font-black text-[#00213f] shrink-0">
                  LOGO
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold text-white truncate">Tu empresa S.A.</span>
                    <BadgeCheck className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  </div>
                  <span className="block text-[10px] text-white/50">Burzaco · Metalmecánica</span>
                </div>
              </div>
              <div className="grid grid-cols-4 divide-x divide-slate-100 border-t border-slate-100">
                {[
                  { n: "12", t: "Productos" },
                  { n: "3", t: "Rubros" },
                  { n: "2", t: "Certif." },
                  { n: "5", t: "Reseñas" },
                ].map((m) => (
                  <div key={m.t} className="py-2 text-center">
                    <p className="text-[13px] font-bold text-slate-800 leading-none tabular-nums">{m.n}</p>
                    <p className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">{m.t}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 px-0.5 leading-snug">
              Así se ve ahora la cabecera. Los números salen de lo que tengas cargado.
            </p>
          </div>

          {/* En una sola columna los bullets van acá. */}
          <ul className="mt-4 space-y-2 md:hidden">
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
              Conviene que le des una mirada
            </p>
            <ul className="space-y-1.5">
              {[
                "La ficha muestra lo que vos cargaste: si falta el logo o la descripción, ahora se nota más.",
                "Los rubros y especialidades son por dónde te encuentran cuando buscan lo que hacés.",
                "Tus productos y servicios aparecen con su foto: los que no tienen quedan opacos al lado.",
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
              href="/perfil/datos"
              onClick={cerrar}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition"
            >
              Revisar mi ficha
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
