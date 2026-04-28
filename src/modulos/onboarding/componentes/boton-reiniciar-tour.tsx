"use client";

import { useState } from "react";
import { HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utilidades";
import { useTour } from "../contexto-tour";
import type { TourId } from "../tipos";

interface BotonReiniciarTourProps {
  tour: TourId;
  label?: string;
  className?: string;
  variant?: "pill" | "ghost";
}

/**
 * Botón "Ver tutorial" reutilizable. Cuando se hace click, reinicia el tour
 * (aunque ya esté visto) y lo vuelve a mostrar desde el paso 1.
 */
export function BotonReiniciarTour({
  tour,
  label = "Ver tutorial",
  className,
  variant = "pill",
}: BotonReiniciarTourProps) {
  const { iniciarTour, tourIncompleto } = useTour();
  const [cargando, setCargando] = useState(false);
  const incompleto = tourIncompleto(tour);

  const onClick = async () => {
    setCargando(true);
    try {
      await iniciarTour(tour);
    } finally {
      setCargando(false);
    }
  };

  const base =
    variant === "pill"
      ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-primary-700 hover:border-primary-200 transition-all shadow-sm"
      : "inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary-700 transition-colors";

  // Cuando el usuario cerró el tour a la mitad lo destacamos: borde primario,
  // color de texto primario y un punto que titila para indicar "pendiente".
  const incompletoClasses = incompleto
    ? variant === "pill"
      ? "relative !border-primary-300 !text-primary-700 !bg-primary-50 animate-pulse"
      : "relative !text-primary-700 animate-pulse"
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={cargando}
      title={incompleto ? "Tenés un tutorial sin terminar — clickeá para continuar" : undefined}
      className={cn(base, incompletoClasses, cargando && "opacity-60 cursor-not-allowed", className)}
    >
      {cargando ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <HelpCircle className="w-3.5 h-3.5" />
      )}
      {label}
      {incompleto && !cargando && (
        <span
          aria-hidden
          className="ml-1 inline-block w-2 h-2 rounded-full bg-primary-500 ring-2 ring-primary-200"
        />
      )}
    </button>
  );
}
