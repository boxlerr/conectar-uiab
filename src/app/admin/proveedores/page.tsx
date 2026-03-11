"use client";

import { useState } from "react";
import { mockedProviders } from "@/modulos/compartido/data/mockDB";
import { Check, X, Wrench, Search, Eye, FileText, Phone, Mail, MapPin, Award, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminProveedoresPage() {
  const [providers, setProviders] = useState(mockedProviders);
  const [filter, setFilter] = useState<"all" | "pending" | "active">("all"); // Default to all
  const [selectedProvider, setSelectedProvider] = useState<typeof mockedProviders[0] | null>(null);

  const handleApprove = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProviders(prev => prev.map(p => p.id === id ? { ...p, status: "active" as const } : p));
    if (selectedProvider?.id === id) {
      setSelectedProvider(prev => prev ? { ...prev, status: "active" as const } : null);
    }
  };

  const handleReject = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProviders(prev => prev.filter(p => p.id !== id));
    if (selectedProvider?.id === id) setSelectedProvider(null);
  };

  const filteredProviders = providers.filter(p => filter === "all" || p.status === filter);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Wrench className="w-8 h-8 text-primary-600" />
            Gestión de Proveedores
          </h1>
          <p className="text-slate-500 mt-1">Administra y verifica los perfiles y documentación de los proveedores físicos.</p>
        </div>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm border-slate-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar proveedor por nombre o email..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button 
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter("pending")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "pending" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Pendientes
          </button>
          <button 
            onClick={() => setFilter("active")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "active" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Activos
          </button>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredProviders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No hay proveedores {filter === "pending" ? "pendientes" : ""}</h3>
            <p className="text-slate-500">No se encontraron proveedores con los filtros actuales.</p>
          </div>
        ) : (
          filteredProviders.map(prov => (
            <Card 
              key={prov.id} 
              className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center shadow-sm border-slate-100 hover:shadow-md transition-all cursor-pointer hover:border-primary-200 group"
              onClick={() => setSelectedProvider(prov)}
            >
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                {prov.logoUrl ? (
                  <img src={prov.logoUrl} alt={prov.name} className="w-full h-full object-cover" />
                ) : (
                  <Wrench className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary-600 transition-colors">{prov.name}</h3>
                  <Badge variant={prov.status === "active" ? "default" : "secondary"} className={prov.status === "active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}>
                    {prov.status === "active" ? "Activo" : "Pendiente de Matricula"}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mb-3">{prov.specialty} • {prov.contactEmail} • {prov.phone}</p>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <FileText className="w-3 h-3" />
                  <span>{prov.certifications?.length || 0} Documentos subidos</span>
                </div>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100 items-center justify-end">
                <Button variant="ghost" className="text-primary-600 hover:text-primary-700 hover:bg-primary-50">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Perfil y Papeles
                </Button>
                {prov.status === "pending" && (
                  <Button onClick={(e) => handleApprove(prov.id, e)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Slide-over Profile Details / Documents Modal */}
      {selectedProvider && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in" 
            onClick={() => setSelectedProvider(null)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl animate-in slide-in-from-right-1/2 duration-300 overflow-y-auto border-l border-slate-200">
             <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                     <Wrench className="w-6 h-6" />
                   </div>
                   <div>
                     <h2 className="text-xl font-bold text-slate-900">{selectedProvider.name}</h2>
                     <p className="text-sm font-medium text-emerald-600">{selectedProvider.specialty}</p>
                   </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedProvider(null)} className="h-8 w-8 rounded-full bg-slate-50 hover:bg-rose-50 hover:text-rose-600">
                  <X className="h-4 w-4" />
                </Button>
             </div>

             <div className="p-6 space-y-8">
               {/* Contact Info */}
               <section>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Información de Contacto</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <Mail className="w-5 h-5 text-slate-400" />
                     <div>
                       <p className="text-xs text-slate-500">Correo Electrónico</p>
                       <p className="text-sm font-medium text-slate-900">{selectedProvider.contactEmail}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <Phone className="w-5 h-5 text-slate-400" />
                     <div>
                       <p className="text-xs text-slate-500">Teléfono</p>
                       <p className="text-sm font-medium text-slate-900">{selectedProvider.phone}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <MapPin className="w-5 h-5 text-slate-400" />
                     <div>
                       <p className="text-xs text-slate-500">Zona de Cobertura</p>
                       <p className="text-sm font-medium text-slate-900">{selectedProvider.zone}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <Calendar className="w-5 h-5 text-slate-400" />
                     <div>
                       <p className="text-xs text-slate-500">Experiencia</p>
                       <p className="text-sm font-medium text-slate-900">{selectedProvider.experienceYears} Años</p>
                     </div>
                   </div>
                 </div>
               </section>

               <section>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Perfil Profesional</h3>
                 <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                   {selectedProvider.description}
                 </p>
               </section>

               <section>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center justify-between">
                   Documentación y Matrículas
                   <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Revisión Obligatoria</Badge>
                 </h3>
                 <div className="space-y-3">
                   {selectedProvider.certifications?.map((cert, i) => (
                     <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-primary-300 transition-colors group">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                           <Award className="w-5 h-5" />
                         </div>
                         <div>
                           <p className="font-semibold text-slate-900 text-sm">{cert} / PDF</p>
                           <p className="text-xs text-slate-500">Subido hace 2 días • 2.4 MB</p>
                         </div>
                       </div>
                       <Button variant="outline" size="sm" className="gap-2 group-hover:bg-primary-50 group-hover:text-primary-700 group-hover:border-primary-200">
                         <Eye className="w-4 h-4" />
                         Visualizar Papeles
                       </Button>
                     </div>
                   ))}

                   {/* Add a fake document for example if none */}
                   {(!selectedProvider.certifications || selectedProvider.certifications.length === 0) && (
                     <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-primary-300 transition-colors group">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                           <Award className="w-5 h-5" />
                         </div>
                         <div>
                           <p className="font-semibold text-slate-900 text-sm">Matrícula de Especialidad / PDF</p>
                           <p className="text-xs text-slate-500">Subido hace 5 hrs • 1.1 MB</p>
                         </div>
                       </div>
                       <Button variant="outline" size="sm" className="gap-2 group-hover:bg-primary-50 group-hover:text-primary-700 group-hover:border-primary-200">
                         <Eye className="w-4 h-4" />
                         Visualizar Papeles
                       </Button>
                     </div>
                   )}
                 </div>
               </section>

               <div className="pt-6 border-t border-slate-100 flex items-center justify-between sticky bottom-0 bg-white/90 backdrop-blur-sm -m-6 p-6 mt-0">
                  <div className="flex items-center gap-3">
                    <Badge variant={selectedProvider.status === "active" ? "default" : "secondary"} className={selectedProvider.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700 max-w-fit"}>
                      Estado Actual: {selectedProvider.status === "active" ? "Verificado" : "Pendiente"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedProvider.status === "pending" && (
                      <>
                        <Button onClick={() => handleReject(selectedProvider.id)} variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50">
                          <X className="w-4 h-4 mr-2" /> Rechazar
                        </Button>
                        <Button onClick={() => handleApprove(selectedProvider.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                          <Check className="w-4 h-4 mr-2" /> Aprobar Proveedor
                        </Button>
                      </>
                    )}
                    {selectedProvider.status === "active" && (
                       <Button onClick={() => setSelectedProvider(null)} className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
                         Cerrar Perfil
                       </Button>
                    )}
                  </div>
               </div>
             </div>
          </div>
        </>
      )}
    </div>
  );
}
