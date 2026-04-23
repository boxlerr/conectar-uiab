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
  const { iniciarTour } = useTour();
  const [cargando, setCargando] = useState(false);

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

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={cargando}
      className={cn(base, cargando && "opacity-60 cursor-not-allowed", className)}
    >
      {cargando ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <HelpCircle className="w-3.5 h-3.5" />
      )}
      {label}
    </button>
  );
}
