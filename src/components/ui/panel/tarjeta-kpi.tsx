import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Sparkline } from "./graficos";
import type { PuntoSerie } from "@/modulos/visitas/estadisticas";

/**
 * Tarjeta de KPI del "Resumen general".
 *
 * Ícono en círculo arriba a la izquierda, el número al lado, la variación
 * arriba a la derecha y el sparkline abajo a la derecha.
 *
 * La variación y la línea SÓLO aparecen si hay una serie real detrás. Cuando no
 * la hay va un guión — que es, además, lo que hace el propio mockup con las
 * métricas que están en cero.
 */

export interface KpiProps {
  icono: LucideIcon;
  valor: number;
  etiqueta: string;
  sub: string;
  href: string;
  /** Paleta del ícono y de la línea. */
  tono: {
    fondo: string;
    texto: string;
    linea: string;
  };
  serie?: PuntoSerie[];
  /** Porcentaje ya redondeado. `null` = no hay base para calcularlo. */
  variacion?: number | null;
  /** Se muestra bajo la variación al pasar el mouse. */
  tituloVariacion?: string;
}

export function TarjetaKpi({
  icono: Icono,
  valor,
  etiqueta,
  sub,
  href,
  tono,
  serie,
  variacion,
  tituloVariacion,
}: KpiProps) {
  const hayLinea = !!serie && serie.some((p) => p.visitas > 0);
  const sube = (variacion ?? 0) >= 0;

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-[0_12px_32px_-8px_rgba(0,33,63,0.12)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tono.fondo}`}
          >
            <Icono className={`h-[18px] w-[18px] ${tono.texto}`} strokeWidth={2} />
          </span>
          <span className="font-poppins text-[34px] font-black leading-none tabular-nums tracking-tight text-[#00213f]">
            {valor.toLocaleString("es-AR")}
          </span>
        </div>

        {variacion !== null && variacion !== undefined ? (
          <span
            title={tituloVariacion}
            className={`mt-1 inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-black tabular-nums ${
              sube ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
            }`}
          >
            {sube ? "+" : ""}
            {variacion}%
            {sube ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          </span>
        ) : (
          // El guión del mockup: dice "no hay variación que mostrar" sin
          // llenar el hueco con un número que no existe.
          <span
            title="Todavía no hay historial para comparar"
            className="mt-1.5 shrink-0 text-slate-300"
          >
            <Minus className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-[#00213f]">{etiqueta}</p>
          <p className="mt-0.5 truncate text-[11.5px] text-slate-400">{sub}</p>
        </div>
        {hayLinea && (
          <Sparkline
            serie={serie}
            color={tono.linea}
            className="h-7 w-[68px] shrink-0 opacity-90 transition-opacity group-hover:opacity-100"
          />
        )}
      </div>
    </Link>
  );
}
