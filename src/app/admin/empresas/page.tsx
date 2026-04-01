"use client";

import { useState } from "react";
import { mockedCompanies } from "@/modulos/compartido/data/mockDB";
import { Check, X, Building, Search, Eye, FileText, Phone, Mail, MapPin, Briefcase, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminEmpresasPage() {
  const [companies, setCompanies] = useState(mockedCompanies);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [selectedCompany, setSelectedCompany] = useState<typeof mockedCompanies[0] | null>(null);

  const handleApprove = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: "approved" as const } : c));
    if (selectedCompany?.id === id) {
      setSelectedCompany(prev => prev ? { ...prev, status: "approved" as const } : null);
    }
  };

  const handleReject = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCompanies(prev => prev.filter(c => c.id !== id));
    if (selectedCompany?.id === id) setSelectedCompany(null);
  };

  const filteredCompanies = companies.filter(c => filter === "all" || c.status === filter);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Building className="w-8 h-8 text-primary-600" />
            Gestión de Empresas
          </h1>
          <p className="text-slate-500 mt-1">Administra los perfiles corporativos y la documentación de las industrias.</p>
        </div>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm border-slate-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar empresa por nombre o email..." 
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
            Activas
          </button>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No hay empresas {filter === "pending" ? "pendientes" : ""}</h3>
            <p className="text-slate-500">No se encontraron empresas con los filtros actuales.</p>
          </div>
        ) : (
          filteredCompanies.map(comp => (
            <Card 
              key={comp.id} 
              className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center shadow-sm border-slate-100 hover:shadow-md transition-all cursor-pointer hover:border-primary-200 group"
              onClick={() => setSelectedCompany(comp)}
            >
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                {comp.logoUrl ? (
                  <img src={comp.logoUrl} alt={comp.name} className="w-full h-full object-cover" />
                ) : (
                  <Building className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary-600 transition-colors">{comp.name}</h3>
                  <Badge variant={comp.status === "approved" ? "default" : "secondary"} className={comp.status === "approved" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}>
                    {comp.status === "approved" ? "Activa" : "Pendiente de Legajo"}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mb-3">{comp.category} • {comp.contactEmail} • {comp.phone}</p>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <FileText className="w-3 h-3" />
                  <span>Legajo impositivo y servicios detallados disponibles</span>
                </div>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100 items-center justify-end">
                <Button variant="ghost" className="text-primary-600 hover:text-primary-700 hover:bg-primary-50">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Perfil y Papeles
                </Button>
                {comp.status === "pending" && (
                  <Button onClick={(e) => handleApprove(comp.id, e)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

       {/* Slide-over Profile Details / Documents Modal for Companies */}
       {selectedCompany && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in" 
            onClick={() => setSelectedCompany(null)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl animate-in slide-in-from-right-1/2 duration-300 overflow-y-auto border-l border-slate-200">
             <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                     <Building className="w-6 h-6" />
                   </div>
                   <div>
                     <h2 className="text-xl font-bold text-slate-900">{selectedCompany.name}</h2>
                     <p className="text-sm font-medium text-blue-600">{selectedCompany.category}</p>
                   </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedCompany(null)} className="h-8 w-8 rounded-full bg-slate-50 hover:bg-rose-50 hover:text-rose-600">
                  <X className="h-4 w-4" />
                </Button>
             </div>

             <div className="p-6 space-y-8">
               {/* Contact Info */}
               <section>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Información Corporativa</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <Mail className="w-5 h-5 text-slate-400" />
                     <div>
                       <p className="text-xs text-slate-500">Correo Comercial</p>
                       <p className="text-sm font-medium text-slate-900">{selectedCompany.contactEmail}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <Phone className="w-5 h-5 text-slate-400" />
                     <div>
                       <p className="text-xs text-slate-500">Teléfono Corporativo</p>
                       <p className="text-sm font-medium text-slate-900">{selectedCompany.phone}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                     <MapPin className="w-5 h-5 text-slate-400" />
                     <div>
                       <p className="text-xs text-slate-500">Dirección / Sede</p>
                       <p className="text-sm font-medium text-slate-900">{selectedCompany.address}</p>
                     </div>
                   </div>
                 </div>
               </section>

               <section>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Acerca de la Empresa</h3>
                 <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                   {selectedCompany.description}
                 </p>
               </section>

                <section>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center justify-between">
                   Servicios Ofrecidos
                 </h3>
                 <div className="flex flex-wrap gap-2">
                   {selectedCompany.servicesOffered?.map((service, i) => (
                      <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100 gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        {service}
                      </span>
                   ))}
                   {(!selectedCompany.servicesOffered || selectedCompany.servicesOffered.length === 0) && (
                     <p className="text-sm text-slate-500 italic">No hay servicios detallados cargados.</p>
                   )}
                 </div>
               </section>

               <section>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center justify-between">
                   Papeles Administrativos y Constancias
                   <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Revisión AFIP/Legal</Badge>
                 </h3>
                 <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-primary-300 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                          <ListTodo className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">Constancia de CUIT e Ingresos Brutos</p>
                          <p className="text-xs text-slate-500">Subido hace 1 día • Válido</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2 group-hover:bg-primary-50 group-hover:text-primary-700 group-hover:border-primary-200">
                        <Eye className="w-4 h-4" />
                        Ver Doc
                      </Button>
                    </div>

                     <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-primary-300 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">Contrato Social / Acta Consultiva</p>
                          <p className="text-xs text-slate-500">Subido hace 2 días • 3.4 MB</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2 group-hover:bg-primary-50 group-hover:text-primary-700 group-hover:border-primary-200">
                        <Eye className="w-4 h-4" />
                        Ver Doc
                      </Button>
                    </div>
                 </div>
               </section>

               <div className="pt-6 border-t border-slate-100 flex items-center justify-between sticky bottom-0 bg-white/90 backdrop-blur-sm -m-6 p-6 mt-0">
                  <div className="flex items-center gap-3">
                    <Badge variant={selectedCompany.status === "approved" ? "default" : "secondary"} className={selectedCompany.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700 max-w-fit"}>
                      Estado Actual: {selectedCompany.status === "approved" ? "Activa/Verificada" : "Legajo Pendiente"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCompany.status === "pending" && (
                      <>
                        <Button onClick={() => handleReject(selectedCompany.id)} variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50">
                          <X className="w-4 h-4 mr-2" /> Rechazar
                        </Button>
                        <Button onClick={() => handleApprove(selectedCompany.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                          <Check className="w-4 h-4 mr-2" /> Aprobar Empresa
                        </Button>
                      </>
                    )}
                    {selectedCompany.status === "approved" && (
                       <Button onClick={() => setSelectedCompany(null)} className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
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
