"use client";

import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Save, User, Building, MapPin, Phone, Mail } from "lucide-react";
import { useState } from "react";
import { mockedCompanies, mockedProviders } from "@/modulos/compartido/data/mockDB";

export default function MiPerfilDatosPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!currentUser) return null;

  const initialData = currentUser.role === "company" ? mockedCompanies[0] : mockedProviders[0];
  const [formData, setFormData] = useState({
    name: initialData.name,
    email: initialData.contactEmail,
    phone: initialData.phone,
    address: currentUser.role === "company" ? (initialData as any).address : (initialData as any).zone,
    description: initialData.description,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Datos y Contacto</h1>
        <p className="text-slate-500 mt-1">Cómo te ven las demás empresas e industrias en el directorio.</p>
      </div>

      <Card className="p-6 border-slate-100 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
            <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 transition-all cursor-pointer">
              {currentUser.role === 'company' ? <Building className="w-8 h-8 mb-1" /> : <User className="w-8 h-8 mb-1" />}
              <span className="text-[10px] font-semibold tracking-wider uppercase">Subir Logo</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Logotipo del Perfil</h3>
              <p className="text-sm text-slate-500">Recomendado 500x500px, PNG o JPG.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Nombre de la Pyme o Proveedor</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> Correo Público</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" /> Teléfono de Contacto</label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {currentUser.role === 'company' ? 'Dirección' : 'Zona de Trabajo'}</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
            </div>

             <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Acerca de nosotros (Descripción del perfil)</label>
              <textarea 
                rows={4}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all resize-none"
              />
              <p className="text-xs text-slate-400 text-right">Escribe qué hacen y cuáles son sus fuertes para destacar.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
             <Button type="submit" disabled={loading} className="gap-2 bg-primary-600 hover:bg-primary-700 w-full sm:w-auto">
               {loading ? (
                 <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               ) : (
                 <Save className="w-4 h-4" />
               )}
               {loading ? "Guardando..." : "Guardar Cambios"}
             </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
