"use client";

import { useState } from "react";
import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { mockedCompanies, mockedProviders, mockedReviews } from "@/modulos/compartido/data/mockDB";
import { ShieldAlert, Check, X, Building, Wrench, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  
  const [pendingCompanies, setPendingCompanies] = useState(
    mockedCompanies.filter((c) => c.status === "pending")
  );
  const [pendingProviders, setPendingProviders] = useState(
    mockedProviders.filter((p) => p.status === "pending")
  );
  const [pendingReviews, setPendingReviews] = useState(
    mockedReviews.filter((r) => r.status === "pending")
  );

  const [activeTab, setActiveTab] = useState<"empresas" | "proveedores" | "resenas">("empresas");

  if (currentUser?.role !== "admin") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Acceso Restringido</h2>
        <p className="text-slate-500 text-center max-w-md">
          Esta página es exclusiva para administradores de la red Conectar-UIAB. Por favor, ingresa con las credenciales adecuadas.
        </p>
      </div>
    );
  }

  const handleApproveCompany = (id: string) => {
    setPendingCompanies(prev => prev.filter(c => c.id !== id));
  };
  const handleRejectCompany = (id: string) => {
    setPendingCompanies(prev => prev.filter(c => c.id !== id));
  };

  const handleApproveProvider = (id: string) => {
    setPendingProviders(prev => prev.filter(p => p.id !== id));
  };
  const handleRejectProvider = (id: string) => {
    setPendingProviders(prev => prev.filter(p => p.id !== id));
  };

  const handleApproveReview = (id: string) => {
    setPendingReviews(prev => prev.filter(r => r.id !== id));
  };
  const handleRejectReview = (id: string) => {
    setPendingReviews(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Panel de Administración</h1>
        <p className="text-slate-500 mt-2">Modera los perfiles y reseñas pendientes de aprobación en la red.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          <button
            onClick={() => setActiveTab("empresas")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "empresas" 
              ? "bg-primary-50 text-primary-700 font-semibold" 
              : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <Building className="w-4 h-4" />
              Empresas
            </div>
            {pendingCompanies.length > 0 && (
              <span className="bg-primary-100 text-primary-700 py-0.5 px-2 rounded-full text-xs">
                {pendingCompanies.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("proveedores")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "proveedores" 
              ? "bg-emerald-50 text-emerald-700 font-semibold" 
              : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <Wrench className="w-4 h-4" />
              Proveedores
            </div>
            {pendingProviders.length > 0 && (
              <span className="bg-emerald-100 text-emerald-700 py-0.5 px-2 rounded-full text-xs">
                {pendingProviders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("resenas")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "resenas" 
              ? "bg-amber-50 text-amber-700 font-semibold" 
              : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4" />
              Reseñas
            </div>
            {pendingReviews.length > 0 && (
              <span className="bg-amber-100 text-amber-700 py-0.5 px-2 rounded-full text-xs">
                {pendingReviews.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === "empresas" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Empresas Pendientes</h2>
              {pendingCompanies.length === 0 ? (
                <p className="text-slate-500">No hay empresas pendientes de aprobación en este momento.</p>
              ) : (
                pendingCompanies.map(comp => (
                  <Card key={comp.id} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-900">{comp.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{comp.category} • {comp.contactEmail} • {comp.phone}</p>
                      <p className="text-sm text-slate-700 mt-3 line-clamp-2">{comp.description}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button onClick={() => handleApproveCompany(comp.id)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Check className="w-4 h-4 mr-2" /> Aprobar
                      </Button>
                      <Button onClick={() => handleRejectCompany(comp.id)} variant="outline" className="flex-1 sm:flex-none text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700">
                        <X className="w-4 h-4 mr-2" /> Rechazar
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === "proveedores" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Proveedores Pendientes</h2>
              {pendingProviders.length === 0 ? (
                <p className="text-slate-500">No hay proveedores pendientes de aprobación en este momento.</p>
              ) : (
                pendingProviders.map(prov => (
                  <Card key={prov.id} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-900">{prov.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{prov.specialty} • {prov.contactEmail} • {prov.phone}</p>
                      <p className="text-sm text-slate-700 mt-3 line-clamp-2">{prov.description}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button onClick={() => handleApproveProvider(prov.id)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Check className="w-4 h-4 mr-2" /> Aprobar
                      </Button>
                      <Button onClick={() => handleRejectProvider(prov.id)} variant="outline" className="flex-1 sm:flex-none text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700">
                        <X className="w-4 h-4 mr-2" /> Rechazar
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === "resenas" && (
            <div className="space-y-4">
               <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Reseñas Pendientes</h2>
              {pendingReviews.length === 0 ? (
                <p className="text-slate-500">No hay reseñas pendientes de moderación en este momento.</p>
              ) : (
                pendingReviews.map(rev => (
                  <Card key={rev.id} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900">De: {rev.authorName}</h3>
                        <span className="text-xs text-slate-400">{rev.date}</span>
                      </div>
                      <div className="flex items-center gap-1 mb-3">
                         <span className="text-amber-500 font-medium text-sm">Validación de {rev.rating} estrellas</span>
                      </div>
                      <p className="text-sm text-slate-700 italic border-l-2 border-slate-200 pl-3 py-1">"{rev.comment}"</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button onClick={() => handleApproveReview(rev.id)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Check className="w-4 h-4 mr-2" /> Aprobar
                      </Button>
                      <Button onClick={() => handleRejectReview(rev.id)} variant="outline" className="flex-1 sm:flex-none text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700">
                        <X className="w-4 h-4 mr-2" /> Rechazar
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
