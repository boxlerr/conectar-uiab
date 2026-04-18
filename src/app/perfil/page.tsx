"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Building, Wrench, ArrowRight, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/cliente";

export default function MiPerfilPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [profileDetails, setProfileDetails] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Esperar a que auth termine de cargar: si hacemos fetch antes, la sesión
    // de Supabase no está aplicada y RLS devuelve 0 (se quedaba cargando hasta F5).
    if (authLoading) return;

    async function loadData() {
      if (!currentUser?.entityId) {
        setIsLoading(false);
        return;
      }

      // Fetch from specific DB Table
      const table = currentUser.role === "company" ? "empresas" : "proveedores";
      const { data, error } = await supabase.from(table).select("*").eq("id", currentUser.entityId).single();
      
      if (data) {
        setProfileDetails(data);
      }

      // Fetch Services/Categories
      if (currentUser.role === "company") {
        const { data: rels } = await supabase.from("empresas_categorias").select("categoria_id, categorias(nombre)").eq("empresa_id", currentUser.entityId);
        if (rels) setServices(rels.map((r: any) => r.categorias?.nombre).filter(Boolean));
      } else if (currentUser.role === "provider") {
        const { data: rels } = await supabase.from("proveedores_categorias").select("categoria_id, categorias(nombre)").eq("proveedor_id", currentUser.entityId);
        if (rels) setServices(rels.map((r: any) => r.categorias?.nombre).filter(Boolean));
      }

      setIsLoading(false);
    }
    loadData();
  }, [authLoading, currentUser?.entityId, currentUser?.role, supabase]);

  if (!currentUser) return null;

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!profileDetails) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 text-lg mb-2">Comienza a configurar tu perfil corporativo</h3>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
          Aún no logramos enlazar tu usuario con los datos de tu empresa en el directorio. Para aparecer en las búsquedas, por favor inicia completando el formulario de tu Sede Principal.
        </p>
        <Link href="/perfil/datos" className="inline-flex items-center justify-center h-11 px-8 font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
          <Wrench className="w-4 h-4 mr-2" />
          Completar mis Datos
        </Link>
      </div>
    );
  }

  const isComplete = profileDetails.estado === "aprobada" || profileDetails.estado === "verificado" || profileDetails.estado === "activo";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido, {profileDetails.razon_social || profileDetails.nombre_comercial || currentUser.name}</h1>
          <p className="text-slate-500 mt-1">
            Revisión general del estado de tu perfil y suscripción.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isComplete ? "default" : "secondary"} className={isComplete ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}>
            Estado: {isComplete ? "Perfil Verificado" : (profileDetails.estado || "En Revisión")}
          </Badge>
        </div>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Info Card */}
        <Card className="p-6 border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-[0.08] transition-opacity">
            {currentUser.role === 'company' ? <Building className="w-24 h-24" /> : <Wrench className="w-24 h-24" />}
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
               <p className="text-sm font-medium text-slate-800">{profileDetails.email || "No especificado"}</p>
            </div>
            <div>
               <p className="text-xs font-semibold text-slate-400 uppercase">Teléfono Publicado</p>
               <p className="text-sm font-medium text-slate-800">{profileDetails.telefono || "No especificado"}</p>
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
            <Badge variant="outline" className="bg-slate-50">{currentUser.role === 'company' ? 'Servicios' : 'Especialidad'}</Badge>
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex flex-wrap gap-2">
              {services.length > 0 ? services.slice(0, 3).map((s: string, i: number) => (
                <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-md border border-slate-200">{s}</span>
              )) : <span className="text-sm text-slate-400 italic">No hay servicios definidos aún</span>}
              
              {services.length > 3 && (
                <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-xs rounded-md">+{services.length - 3} más</span>
              )}
            </div>
            <p className="text-xs text-slate-500 line-clamp-2 mt-3">{profileDetails.descripcion || "Dirígete a Datos y Contacto para escribir un resumen sobre ti."}</p>
          </div>
          <Link href="/perfil/servicios" className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 transition">
            Gestionar mis especialidades <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Card>

      </div>
    </div>
  );
}
