"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * Pie compartido de los carteles de novedad y el contrato que los une.
 *
 * POR QUÉ EXISTE
 *
 * Antes cada cartel decidía solo si le tocaba mostrarse, y `novedadPendiente`
 * elegía UNO cuando correspondían varios: el resto quedaba para el próximo
 * ingreso. En la práctica eso significó que a quien le tocaban dos, la segunda
 * no la veía nunca — entraba, cerraba la de arriba y la otra le aparecía días
 * después, o nunca si alguien se la marcaba antes.
 *
 * Ahora los pendientes se recorren en una pila (ver `pila-novedades.tsx`): se
 * ven de a uno, con "Siguiente" para avanzar y "Atrás" para releer el anterior.
 * Este archivo tiene el pie —contador, navegación y botón de acción— y el tipo
 * de props que todos los carteles reciben, para que los tres se vean iguales.
 *
 * Vive separado del controlador a propósito: si el pie estuviera ahí, cada
 * cartel importaría al controlador que a su vez los importa a ellos, y el
 * import circular rompe el bundle en silencio.
 */

export interface PropsNovedad {
  /** 1-based: lo que se muestra en "2 de 3". */
  paso: number;
  total: number;
  /** `undefined` en el primero. */
  onAtras?: () => void;
  /** `undefined` en el último. */
  onSiguiente?: () => void;
  onCerrar: () => void;
}

export function PieNovedad({
  paso,
  total,
  onAtras,
  onSiguiente,
  onCerrar,
  cta,
}: PropsNovedad & {
  /** La acción concreta del cartel: a dónde lleva y cómo se llama. */
  cta: { href: string; label: string };
}) {
  const hayMas = Boolean(onSiguiente);

  return (
    <div className="flex flex-col-reverse gap-3 pt-5 pb-6 md:pb-0 sm:flex-row sm:items-center">
      {total > 1 && (
        <span className="text-xs font-bold tabular-nums text-slate-400">
          {paso} de {total}
        </span>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 sm:ml-auto">
        {onAtras && (
          <button
            onClick={onAtras}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Atrás
          </button>
        )}

        {!hayMas && (
          <button
            onClick={onCerrar}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            Después
          </button>
        )}

        {/*
          Cuando quedan carteles por ver, la acción principal es seguir
          leyéndolos: irse a otra página ahora deja los demás sin ver. Por eso
          el enlace del cartel pasa a secundario y "Siguiente" se queda con el
          botón lleno.
        */}
        <Link
          href={cta.href}
          onClick={onCerrar}
          className={
            hayMas
              ? "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              : "inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
          }
        >
          {cta.label}
          <ArrowRight className="w-4 h-4" />
        </Link>

        {onSiguiente && (
          <button
            onClick={onSiguiente}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
          >
            Siguiente
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
