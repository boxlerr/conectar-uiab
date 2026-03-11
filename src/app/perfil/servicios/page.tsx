"use client";

import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Briefcase, Plus, GripVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { mockedCompanies } from "@/modulos/compartido/data/mockDB";

export default function MiPerfilServiciosPage() {
  const { currentUser } = useAuth();
  
  if (!currentUser) return null;

  // Simulate initial services
  const initialData = currentUser.role === "company" ? mockedCompanies[0].servicesOffered || [] : [];
  
  const [services, setServices] = useState<string[]>(initialData.length ? initialData : ["Mantenimiento Correctivo"]);
  const [newService, setNewService] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newService.trim()) {
      setServices([...services, newService.trim()]);
      setNewService("");
    }
  };

  const handleRemove = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Servicios y Especialidades</h1>
        <p className="text-slate-500 mt-1">Añade palabras clave o servicios específicos que ofreces para aparecer en búsquedas.</p>
      </div>

      <Card className="p-6 border-slate-100 shadow-sm">
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Ej: Tornería CNC, Instalación Eléctrica, etc." 
              value={newService}
              onChange={e => setNewService(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
          </div>
          <Button type="submit" disabled={!newService.trim()} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Agregar Servicio
          </Button>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 px-2">
            <h3 className="text-sm font-semibold text-slate-700">Tus Servicios Actuales ({services.length})</h3>
            <span className="text-xs text-slate-400">Puedes arrastrarlos para ordenar</span>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No has añadido ningún servicio todavía.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {services.map((service, idx) => (
                <li key={idx} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm group hover:border-primary-300 transition-colors">
                  <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-slate-800 text-sm">{service}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemove(idx)}
                    className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
