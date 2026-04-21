"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building, Wrench, Briefcase, Star, DollarSign, UserPlus, Activity,
  ChevronLeft, ChevronRight,
} from "lucide-react";

type ActividadItem = {
  id: string;
  tipo: "empresa" | "proveedor" | "oportunidad" | "resena" | "pago" | "usuario";
  titulo: string;
  detalle?: string;
  estado?: string | null;
  fecha: string;
  href: string;
  esNuevo: boolean;
};

const TIPO_META: Record<
  ActividadItem["tipo"],
  { icon: typeof Building; bg: string; color: string; label: string }
> = {
  empresa:    { icon: Building,   bg: "bg-blue-50",    color: "text-blue-600",    label: "Empresa" },
  proveedor:  { icon: Wrench,     bg: "bg-emerald-50", color: "text-emerald-600", label: "Particular" },
  oportunidad:{ icon: Briefcase,  bg: "bg-amber-50",   color: "text-amber-600",   label: "Oportunidad" },
  resena:     { icon: Star,       bg: "bg-violet-50",  color: "text-violet-600",  label: "Reseña" },
  pago:       { icon: DollarSign, bg: "bg-primary-50", color: "text-primary-700", label: "Pago" },
  usuario:    { icon: UserPlus,   bg: "bg-slate-100",  color: "text-slate-600",   label: "Usuario" },
};

function fechaRelativa(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d}d`;
  return new Date(fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

const POR_PAGINA = 6;

export function ActividadReciente({ items }: { items: ActividadItem[] }) {
  const [pagina, setPagina] = useState(0);
  const totalPaginas = Math.ceil(items.length / POR_PAGINA);
  const visibles = items.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);

  return (
    <div className="lg:col-span-2 bg-white rounded-lg shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 flex flex-col">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-600" />
            Actividad reciente
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Movimientos de toda la plataforma. Las novedades de las últimas 24h están marcadas.
          </p>
        </div>
        {totalPaginas > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
              disabled={pagina === 0}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500 tabular-nums px-1">
              {pagina + 1} / {totalPaginas}
            </span>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
              disabled={pagina === totalPaginas - 1}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1">
        {visibles.length === 0 ? (
          <p className="p-6 text-sm text-slate-500 text-center">Sin actividad registrada.</p>
        ) : (
          visibles.map((item) => {
            const meta = TIPO_META[item.tipo];
            const Icon = meta.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50/70 transition-colors group border-b border-slate-50 last:border-0"
              >
                <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${meta.bg} ${meta.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {meta.label}
                    </span>
                    {item.esNuevo && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase tracking-widest">
                        Nuevo
                      </span>
                    )}
                    {item.estado && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-widest ${
                        item.estado === "abierta" || item.estado === "aprobada" || item.estado === "aprobado"
                          ? "bg-emerald-50 text-emerald-700"
                          : item.estado === "pendiente_revision" || item.estado === "pendiente"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {item.estado.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">{item.titulo}</p>
                  {item.detalle && <p className="text-xs text-slate-500 truncate">{item.detalle}</p>}
                </div>
                <span className="text-[11px] text-slate-400 tabular-nums whitespace-nowrap pt-1">
                  {fechaRelativa(item.fecha)}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
