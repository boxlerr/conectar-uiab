import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

/**
 * Piezas compartidas del panel.
 *
 * El panel viejo titulaba cada bloque con versalitas de 10px y mucho tracking.
 * Se leían como etiquetas de formulario, no como títulos de sección: en el
 * mockup son títulos en caja normal, de 15px, con un ícono al lado. Están acá
 * para que los ocho bloques del panel se titulen igual y no vuelvan a divergir.
 */

export const TARJETA =
  "overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_2px_16px_-6px_rgba(0,33,63,0.06)]";

interface CabeceraProps {
  titulo: string;
  icono?: LucideIcon;
  /** Color del ícono. Sin fondo: el ícono va suelto, como en el mockup. */
  tonoIcono?: string;
  accion?: { href: string; label: string };
  /** Bajada opcional bajo el título. */
  sub?: string;
  className?: string;
}

export function CabeceraPanel({
  titulo,
  icono: Icono,
  tonoIcono = "text-[#2563eb]",
  accion,
  sub,
  className = "",
}: CabeceraProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6 ${className}`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {Icono && <Icono className={`h-[18px] w-[18px] shrink-0 ${tonoIcono}`} strokeWidth={2.2} />}
        <div className="min-w-0">
          <h2 className="truncate font-poppins text-[15px] font-bold tracking-tight text-[#00213f]">
            {titulo}
          </h2>
          {sub && <p className="mt-0.5 truncate text-[12px] text-slate-400">{sub}</p>}
        </div>
      </div>
      {accion && (
        <Link
          href={accion.href}
          className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[12.5px] font-semibold text-[#2563eb] transition-colors hover:text-[#00213f]"
        >
          {accion.label}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

/**
 * Título de bloque suelto, fuera de tarjeta (el "Resumen general" del mockup).
 * Lleva una barrita de acento en vez de caja, así no compite con los títulos
 * que sí están adentro de una tarjeta.
 */
export function TituloBloque({
  titulo,
  icono: Icono,
  accion,
}: {
  titulo: string;
  icono?: LucideIcon;
  accion?: { href: string; label: string };
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <div className="flex items-center gap-2">
        {Icono && <Icono className="h-[17px] w-[17px] text-[#2563eb]" strokeWidth={2.2} />}
        <h2 className="font-poppins text-[17px] font-bold tracking-tight text-[#00213f]">
          {titulo}
        </h2>
      </div>
      {accion && (
        <Link
          href={accion.href}
          className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[12.5px] font-semibold text-[#2563eb] transition-colors hover:text-[#00213f]"
        >
          {accion.label}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

/** Botón de ancho completo al pie de una tarjeta, como el del mockup. */
export function PieTarjeta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div className="px-4 pb-4 pt-1">
      <Link
        href={href}
        className="flex items-center justify-center rounded-xl bg-[#eff6ff] px-4 py-2.5 text-[13px] font-bold text-[#2563eb] transition-colors hover:bg-[#dbeafe]"
      >
        {children}
      </Link>
    </div>
  );
}
