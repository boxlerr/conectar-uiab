"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Star, MessageSquare, X, Quote } from "lucide-react";
import { FormularioResena } from "./FormularioResena";

interface ResenasPerfilProps {
  resenasAprobadas: any[];
  targetType: "empresa" | "proveedor";
  targetId: string;
}

function Estrellas({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= n ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

export function ResenasPerfil({ resenasAprobadas, targetType, targetId }: ResenasPerfilProps) {
  const [resenaSeleccionada, setResenaSeleccionada] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calc rating
  const total = resenasAprobadas.length;
  const prom =
    total > 0
      ? (resenasAprobadas.reduce((acc, r) => acc + r.calificacion, 0) / total).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      {/* Listado de Opiniones */}
      <div className="bg-white p-5 sm:p-7 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-amber-100 bg-amber-50">
              <MessageSquare className="h-4 w-4 text-amber-500" />
            </span>
            <div>
              <h2 className="font-manrope text-[17px] font-black tracking-tight text-[#00213f]">
                Reseñas{total > 0 && <span className="font-bold text-slate-400"> ({total})</span>}
              </h2>
              <span className="mt-1.5 block h-[3px] w-7 rounded-full bg-amber-400" />
            </div>
          </div>
          {total > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3.5 py-2">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span className="font-manrope text-lg font-black leading-none text-amber-900">{prom}</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700">
                / {total} {total === 1 ? "opinión" : "opiniones"}
              </span>
            </div>
          )}
        </div>

        {/* El vacío ocupaba 300px de tarjeta para decir que no hay nada: en una
            base con 0 reseñas aprobadas, ese cartel era el bloque más grande de
            las 59 fichas. Ahora es un renglón. */}
        {total === 0 ? (
          <p className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-4 py-3 text-[13.5px] leading-relaxed text-slate-500">
            <Star className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
            Todavía no recibió reseñas de la red. Si trabajaste con esta empresa, tu opinión es la
            primera.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {resenasAprobadas.map((r) => {
              const autorNombre =
                r.empresa_autora?.razon_social || 
                [r.proveedor_autor?.nombre, r.proveedor_autor?.apellido].filter(Boolean).join(" ") ||
                "Usuario de la Red";

              return (
                <div 
                  key={r.id} 
                  onClick={() => setResenaSeleccionada({ ...r, autorNombre })}
                  className="bg-white rounded-xl p-6 shadow-[0_4px_24px_rgba(0,33,63,0.03)] border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group flex flex-col h-[220px]"
                >
                  <div className="flex justify-between items-start mb-3">
                    <Estrellas n={r.calificacion} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(r.creada_en).toLocaleDateString("es-AR", { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex-grow overflow-hidden relative">
                    <Quote className="w-8 h-8 text-slate-100 absolute -top-1 -left-1 -z-10" />
                    <p className="text-sm text-slate-700 leading-relaxed font-medium line-clamp-4 relative z-10 pt-1">
                      {r.comentario}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 mt-auto flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{autorNombre}</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">Socio Verificado</p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Leer más &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para Reseña Expandida */}
      {resenaSeleccionada && mounted && createPortal(
        <>
          <div className="fixed inset-0 bg-slate-900/60 z-[9998] transition-opacity" onClick={() => setResenaSeleccionada(null)} />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85svh] pointer-events-auto">
              <div className="p-5 sm:p-7 border-b border-slate-100 flex justify-between items-start bg-slate-50 shrink-0">
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{resenaSeleccionada.autorNombre}</h3>
                  <div className="flex items-center gap-2">
                    <Estrellas n={resenaSeleccionada.calificacion} />
                    <span className="text-xs sm:text-sm font-medium text-slate-500">
                      • {new Date(resenaSeleccionada.creada_en).toLocaleDateString("es-AR", { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <button onClick={() => setResenaSeleccionada(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-800 transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 sm:p-8 overflow-y-auto min-h-0">
                <Quote className="w-10 h-10 text-slate-100 mb-4" />
                <p className="text-[15px] sm:text-base leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">
                  {resenaSeleccionada.comentario}
                </p>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Caja para Escribir Reseña */}
      <FormularioResena targetType={targetType} targetId={targetId} />
    </div>
  );
}
