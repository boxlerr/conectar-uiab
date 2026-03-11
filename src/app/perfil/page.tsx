"use client";

import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Building, Wrench, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { mockedCompanies, mockedProviders } from "@/modulos/compartido/data/mockDB";

export default function MiPerfilPage() {
  const { currentUser } = useAuth();
  
  if (!currentUser) return null;

  // Simulate finding the user's detailed profile based on their role
  const profileDetails = currentUser.role === "company" 
    ? mockedCompanies[0] 
    : mockedProviders[0];

  const isComplete = profileDetails.status === "active";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido, {currentUser.name}</h1>
          <p className="text-slate-500 mt-1">
            Revisión general del estado de tu perfil y suscripción.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isComplete ? "default" : "secondary"} className={isComplete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
            Estado: {isComplete ? "Perfil Verificado" : "Pendiente de Legajo"}
          </Badge>
        </div>
      </div>

      {!isComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
          <div className="bg-amber-100 p-3 rounded-full text-amber-600 flex-shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-amber-900 mb-1">Falta cargar tu documentación</h3>
            <p className="text-sm text-amber-700/80">
              Para que tu perfil sea visible en el directorio, es requerido subir las constancias impositivas o matrículas correspondientes.
            </p>
          </div>
          <Link href="/perfil/documentos" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm whitespace-nowrap shadow-sm shadow-amber-600/20 transition-colors">
            Cargar Papeles
          </Link>
        </div>
      )}

      {/* Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Info Card */}
        <Card className="p-6 border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-[0.08] transition-opacity">
            {currentUser.role === 'empresa' ? <Building className="w-24 h-24" /> : <Wrench className="w-24 h-24" />}
          </div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
               <User className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Datos y Contacto</h2>
          </div>
          <div className="space-y-4 mb-6 relative z-10">
            <div>
               <p className="text-xs font-semibold text-slate-400 uppercase">Correo de Contacto</p>
               <p className="text-sm font-medium text-slate-800">{profileDetails.contactEmail}</p>
            </div>
            <div>
               <p className="text-xs font-semibold text-slate-400 uppercase">Teléfono Publicado</p>
               <p className="text-sm font-medium text-slate-800">{profileDetails.phone}</p>
            </div>
          </div>
          <Link href="/perfil/datos" className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 transition relative z-10">
            Actualizar mi información <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Card>

        {/* Services Card */}
        <Card className="p-6 border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Mis Servicios</h2>
            </div>
            <Badge variant="outline" className="bg-slate-50">{currentUser.role === 'empresa' ? 'Servicios' : 'Especialidad'}</Badge>
          </div>
          <div className="space-y-3 mb-6">
            {currentUser.role === 'empresa' ? (
              <div className="flex flex-wrap gap-2">
                {profileDetails.servicesOffered?.slice(0, 3).map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-md border border-slate-200">{s}</span>
                ))}
                {(profileDetails.servicesOffered?.length || 0) > 3 && (
                  <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-xs rounded-md">+{profileDetails.servicesOffered!.length - 3} más</span>
                )}
              </div>
            ) : (
               <p className="text-sm border-l-2 border-emerald-500 pl-3 py-1 font-medium text-slate-700">
                 {(profileDetails as any).specialty}
               </p>
            )}
            <p className="text-xs text-slate-500 line-clamp-2 mt-3">{profileDetails.description}</p>
          </div>
          <Link href="/perfil/servicios" className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 transition">
            Crear y editar servicios <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Card>

      </div>
    </div>
  );
}
