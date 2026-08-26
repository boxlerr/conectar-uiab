"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, MoreVertical } from "lucide-react";
import { BotonReiniciarTour } from "@/modulos/onboarding/componentes/boton-reiniciar-tour";

/**
 * El menú de los tres puntos del hero.
 *
 * El hero tenía tres botones en línea y cada pantalla nueva quería sumar uno
 * más. Acá quedan la acción primaria y la secundaria a la vista, y el resto
 * —las pantallas de configuración de la ficha y el tutorial— detrás de este
 * menú, como en el mockup.
 *
 * El botón "Ver tutorial" vive adentro: el paso de cierre del tour lo nombra,
 * así que si se mueve de acá hay que corregir ese texto en
 * `src/modulos/onboarding/pasos/pasos-dashboard.tsx`.
 */
export function MenuHero({
  entradas,
  hrefFicha,
}: {
  entradas: { href: string; label: string }[];
  hrefFicha: string | null;
}) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function fuera(e: MouseEvent) {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  return (
    <div className="relative" ref={caja}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Más opciones"
        className={`flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-white/15 text-white/70 transition-all hover:bg-white/[0.18] hover:text-white ${
          abierto ? "bg-white/[0.18] text-white" : "bg-white/10"
        }`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 max-h-[min(70svh,26rem)] w-60 origin-top-right overflow-y-auto rounded-xl border border-slate-200/70 bg-white p-1.5 shadow-[0_20px_50px_-12px_rgba(0,33,63,0.35)]"
        >
          {/* Abajo de `sm` el botón de la ficha no entra en la fila junto a
              "Editar Datos" y este menú: ahí la ficha se llega por acá. */}
          {hrefFicha && (
            <Link
              href={hrefFicha}
              target="_blank"
              role="menuitem"
              onClick={() => setAbierto(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-[#00213f] transition-colors hover:bg-[#f2f5f8] sm:hidden"
            >
              <Eye className="h-4 w-4 text-slate-400" />
              Ver ficha pública
            </Link>
          )}

          {entradas.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              role="menuitem"
              onClick={() => setAbierto(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-[#00213f] transition-colors hover:bg-[#f2f5f8]"
            >
              {e.label}
            </Link>
          ))}

          <div className="my-1 h-px bg-slate-100" />

          <BotonReiniciarTour
            tour="dashboard"
            label="Ver tutorial"
            variant="ghost"
            className="w-full justify-start gap-2.5 rounded-lg px-3 py-2 !text-[13px] font-semibold !text-[#00213f] hover:bg-[#f2f5f8]"
          />
        </div>
      )}
    </div>
  );
}
