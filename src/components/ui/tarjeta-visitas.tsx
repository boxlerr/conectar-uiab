"use client";

import { useEffect, useState } from "react";
import { Eye, TrendingUp } from "lucide-react";
import { obtenerMisVisitas } from "@/modulos/visitas/acciones";

/**
 * Widget autosuficiente con las visitas a la ficha del usuario logueado.
 * Se puede dropear en cualquier panel de socio. No renderiza nada si el
 * usuario no tiene entidad o aún no hubo visitas registrables.
 */
export function TarjetaVisitas() {
  const [data, setData] = useState<{ total: number; ultimos30: number } | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    let activo = true;
    obtenerMisVisitas()
      .then((r) => {
        if (activo) {
          setData(r);
          setCargado(true);
        }
      })
      .catch(() => activo && setCargado(true));
    return () => {
      activo = false;
    };
  }, []);

  if (!cargado || !data) return null;

  return (
    <div className="bg-white rounded-lg p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-100">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-md bg-violet-50 text-violet-700 flex items-center justify-center">
          <Eye className="w-5 h-5" />
        </div>
        {data.ultimos30 > 0 && (
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-violet-50 text-violet-700 uppercase tracking-widest flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {data.ultimos30} en 30d
          </span>
        )}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Visitas a tu ficha
      </p>
      <p
        className="font-bold text-slate-900 tabular-nums leading-none mt-1"
        style={{ fontSize: "clamp(1.75rem, 2.5vw, 2.25rem)" }}
      >
        {data.total.toLocaleString("es-AR")}
      </p>
      <p className="text-xs text-slate-400 mt-2">
        {data.ultimos30 > 0
          ? `${data.ultimos30} en los últimos 30 días`
          : "Total de visitas a tu perfil público"}
      </p>
    </div>
  );
}
