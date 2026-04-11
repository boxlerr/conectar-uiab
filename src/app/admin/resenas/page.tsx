"use client";

import { useState } from "react";
import { mockedReviews } from "@/modulos/compartido/datos/datos-prueba";
import { Check, X, MessageSquare, Star, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminResenasPage() {
  const [reviews, setReviews] = useState(mockedReviews);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");

  const handleApprove = (id: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: "approved" as const } : r));
  };

  const handleReject = (id: string) => {
    // Para simplificar, aquí podemos rechazar/eliminar la reseña
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  const filteredReviews = reviews.filter(r => filter === "all" || r.status === filter);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary-600" />
            Gestión de Reseñas
          </h1>
          <p className="text-slate-500 mt-1">Revisa y aprueba las valoraciones publicadas en la plataforma.</p>
        </div>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm border-slate-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por autor o contenido..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button 
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Todas
          </button>
          <button 
            onClick={() => setFilter("pending")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "pending" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Pendientes
          </button>
          <button 
            onClick={() => setFilter("approved")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "approved" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Aprobadas
          </button>
        </div>
      </Card>

      <div className="space-y-4">
         {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No hay reseñas {filter === "pending" ? "pendientes" : ""}</h3>
            <p className="text-slate-500">No se encontraron reseñas con los filtros actuales.</p>
          </div>
        ) : (
          filteredReviews.map(rev => (
            <Card key={rev.id} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center shadow-sm border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-900">De: {rev.authorName}</h3>
                    <Badge variant={rev.status === "approved" ? "default" : "secondary"} className={rev.status === "approved" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}>
                      {rev.status === "approved" ? "Aprobada" : "Pendiente"}
                    </Badge>
                  </div>
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{rev.date}</span>
                </div>
                <div className="flex items-center gap-1 mb-3 bg-amber-50 inline-flex px-2 py-1 rounded-lg border border-amber-100">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < rev.rating ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                  ))}
                  <span className="ml-2 text-sm font-semibold text-amber-700">{rev.rating}.0</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-700 italic">"{rev.comment}"</p>
                </div>
              </div>
              
              {rev.status === "pending" && (
                <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <Button onClick={() => handleApprove(rev.id)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20">
                    <Check className="w-4 h-4 mr-2" /> Aprobar
                  </Button>
                  <Button onClick={() => handleReject(rev.id)} variant="outline" className="flex-1 sm:flex-none text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-colors">
                    <X className="w-4 h-4 mr-2" /> Rechazar
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
