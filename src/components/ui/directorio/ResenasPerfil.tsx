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
    <div className="space-y-10">
      {/* Listado de Opiniones */}
      <div className="bg-white p-10 rounded-2xl shadow-xl shadow-primary/5 border border-slate-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100/50">
              <MessageSquare className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-manrope text-2xl font-extrabold text-slate-800 tracking-tight">Evaluaciones</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Lo que opina nuestra red industrial</p>
            </div>
          </div>
          {total > 0 && (
            <div className="text-right sm:text-center px-6 py-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="text-2xl font-black text-amber-900 leading-none">{prom}</div>
              <div className="flex items-center gap-1 mt-1 justify-end sm:justify-center">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">{total} OPINIONES</span>
              </div>
            </div>
          )}
        </div>

        {total === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Aún no hay reseñas</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Esta empresa aún no ha recibido evaluaciones públicas verificadas. ¡Sé el primero en opinar!
            </p>
          </div>
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
            <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] pointer-events-auto">
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
