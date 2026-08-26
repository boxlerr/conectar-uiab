import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Award,
  BadgeCheck,
  Inbox,
  PackageSearch,
  Pencil,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { CabeceraPanel, TARJETA } from "./piezas";
import { haceCuanto, type EventoActividad, type TipoEvento } from "@/modulos/panel/actividad";

/**
 * "Actividad reciente": la línea de tiempo de la ficha.
 *
 * Cada fila es un hecho con fecha real reconstruido de la base — ver
 * `src/modulos/panel/actividad.ts` para por qué se arma así y no desde una
 * tabla de log.
 */

const ICONO: Record<TipoEvento, LucideIcon> = {
  alta: Sparkles,
  verificacion: BadgeCheck,
  ficha_editada: Pencil,
  item: PackageSearch,
  certificacion: Award,
  oportunidad: Target,
  solicitud: Inbox,
};

const TONO: Record<TipoEvento, string> = {
  alta: "bg-violet-50 text-violet-500",
  verificacion: "bg-emerald-50 text-emerald-500",
  ficha_editada: "bg-blue-50 text-blue-500",
  item: "bg-teal-50 text-teal-500",
  certificacion: "bg-amber-50 text-amber-500",
  oportunidad: "bg-orange-50 text-orange-500",
  solicitud: "bg-indigo-50 text-indigo-500",
};

export function TarjetaActividad({ eventos }: { eventos: EventoActividad[] }) {
  return (
    <section className={`flex h-full flex-col ${TARJETA}`}>
      <CabeceraPanel
        titulo="Actividad reciente"
        icono={Activity}
        tonoIcono="text-violet-500"
        accion={{ href: "/perfil", label: "Ver todo" }}
      />

      {eventos.length > 0 ? (
        <ul className="flex-1 divide-y divide-slate-50">
          {eventos.map((ev) => {
            const Icono = ICONO[ev.tipo];
            const fila = (
              <div className="flex items-start gap-3 px-5 py-3.5 sm:px-6">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONO[ev.tipo]}`}
                >
                  <Icono className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-[#00213f]">{ev.titulo}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-slate-400">{ev.detalle}</p>
                </div>
                <span className="shrink-0 whitespace-nowrap pt-0.5 text-[11.5px] text-slate-400">
                  {haceCuanto(ev.fecha)}
                </span>
              </div>
            );

            return (
              <li key={ev.id}>
                {ev.href ? (
                  <Link href={ev.href} className="block transition-colors hover:bg-[#f8fafc]">
                    {fila}
                  </Link>
                ) : (
                  fila
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
          <Image
            src="/panel/ilustracion-ficha.webp"
            alt=""
            width={220}
            height={220}
            className="h-20 w-20 rounded-2xl object-cover ring-1 ring-slate-200/70"
            aria-hidden
          />
          <p className="mt-3.5 text-[13px] font-bold text-[#00213f]">Todavía no hay movimientos</p>
          <p className="mt-1 max-w-[30ch] text-[12px] leading-relaxed text-slate-400">
            Acá vas a ver lo que pasa con tu ficha: productos que cargues, certificaciones y
            solicitudes que recibas.
          </p>
        </div>
      )}
    </section>
  );
}
