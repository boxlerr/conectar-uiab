"use client";

import { Star, MessageSquare } from "lucide-react";
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resenasAprobadas.map((r) => {
              const autorNombre =
                r.empresa_autora?.razon_social || 
                [r.proveedor_autor?.nombre, r.proveedor_autor?.apellido].filter(Boolean).join(" ") ||
                "Usuario de la Red";

              return (
                <div key={r.id} className="bg-slate-50 rounded-xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <MessageSquare className="w-24 h-24 rotate-12" />
                  </div>
                  <div className="flex flex-col h-full relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <Estrellas n={r.calificacion} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(r.creada_en).toLocaleDateString("es-AR", { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-6 italic flex-grow relative">
                      <span className="text-2xl text-slate-300 font-serif absolute -top-3 -left-2">"</span>
                      <span className="relative z-10">{r.comentario}</span>
                      <span className="text-2xl text-slate-300 font-serif absolute -bottom-5 right-0 rotate-180">"</span>
                    </p>
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-xs font-bold text-slate-800">{autorNombre}</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Miembro UIAB</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Caja para Escribir Reseña */}
      <FormularioResena targetType={targetType} targetId={targetId} />
    </div>
  );
}
