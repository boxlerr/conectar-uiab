import Link from "next/link";
import { ChevronRight, Zap, type LucideIcon } from "lucide-react";
import { CabeceraPanel, TARJETA } from "./piezas";

/**
 * Accesos directos del panel.
 *
 * Cada uno lleva su propio color: en una lista de cinco íconos todos grises, la
 * fila que uno busca no se encuentra de un vistazo — hay que leer las cinco.
 * El color es el ancla, y por eso el orden y el color de cada acción no deberían
 * cambiar de una versión a la otra.
 *
 * OJO: `/perfil/documentos` no está en la navegación de /perfil. Esta lista es
 * el único camino a esa pantalla en toda la app.
 */

export interface AccionRapida {
  href: string;
  icono: LucideIcon;
  label: string;
  tono: string;
}

export function AccionesRapidas({ acciones }: { acciones: AccionRapida[] }) {
  return (
    <section data-tour="dash-quick" className={TARJETA}>
      <CabeceraPanel titulo="Acciones rápidas" icono={Zap} tonoIcono="text-amber-400" />
      <div className="p-2">
        {acciones.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#f5f8fc]"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${a.tono}`}
            >
              <a.icono className="h-[17px] w-[17px]" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[#00213f]">
              {a.label}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
          </Link>
        ))}
      </div>
    </section>
  );
}
