"use client";

import { use } from "react";
import { mockedProviders, mockedReviews } from "@/data/mockDB";
import { User, MapPin, Mail, Phone, Star, ChevronLeft, CheckCircle2, Award, ShieldCheck, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ProviderProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentUser } = useAuth();
  
  const provider = mockedProviders.find(p => p.id === id);
  const providerReviews = mockedReviews.filter(r => r.targetId === id && r.status === "approved");

  if (!provider) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Proveedor no encontrado</h2>
        <Link href="/providers">
          <Button variant="outline">Volver al directorio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Cover */}
      <div className="h-48 md:h-64 bg-emerald-900 w-full relative">
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 to-transparent"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-24 z-10">
        <Link href="/providers" className="inline-flex items-center text-white/80 hover:text-white mb-6 font-medium text-sm transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Volver al directorio
        </Link>
        
        {/* Profile Header Card */}
        <Card className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center shadow-lg border-slate-200">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white border-4 border-emerald-50 shadow-md flex items-center justify-center flex-shrink-0 overflow-hidden">
             {provider.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={provider.avatarUrl} alt={provider.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-300" />
              )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              {provider.name}
              {provider.status === "approved" && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 mb-4">
              <Badge variant="success" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                <Wrench className="w-3.5 h-3.5 mr-1.5" />
                {provider.specialty}
              </Badge>
              <div className="flex items-center text-amber-500 font-medium text-sm">
                 <Star className="w-4 h-4 fill-amber-500 mr-1" />
                 {provider.rating} ({provider.reviewCount} reseñas)
              </div>
            </div>
            <p className="text-slate-600 max-w-2xl">{provider.description}</p>
          </div>

          <div className="w-full md:w-auto mt-4 md:mt-0">
             <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                Contratar Servicio
             </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
             <Card className="p-6 md:p-8">
               <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Credenciales y Experiencia</h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-start gap-4">
                     <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <Award className="w-6 h-6 text-emerald-600" />
                     </div>
                     <div>
                        <h4 className="font-semibold text-slate-900">Años de Experiencia</h4>
                        <p className="text-slate-600 text-sm">{provider.experienceYears}+ años brindando servicio al sector industrial.</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-4">
                     <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-emerald-600" />
                     </div>
                     <div>
                        <h4 className="font-semibold text-slate-900">Zona de Cobertura</h4>
                        <p className="text-slate-600 text-sm">{provider.zone}</p>
                     </div>
                  </div>
               </div>

               <h3 className="font-semibold text-slate-900 mb-4">Certificaciones Habilitantes</h3>
               <div className="flex flex-wrap gap-2">
                 {provider.certifications.map((s, idx) => (
                   <span key={idx} className="flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium border border-blue-100">
                     <ShieldCheck className="w-4 h-4" /> {s}
                   </span>
                 ))}
               </div>
             </Card>
             
             <Card className="p-6 md:p-8">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-slate-900">Reseñas de Empresas</h2>
                 {currentUser?.role === 'company' && (
                   <Button variant="outline" size="sm">Escribir Reseña</Button>
                 )}
               </div>
               
               {providerReviews.length === 0 ? (
                 <p className="text-slate-500 italic">No hay reseñas visibles aún.</p>
               ) : (
                 <div className="space-y-6">
                   {providerReviews.map(r => (
                     <div key={r.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                       <div className="flex items-center justify-between mb-2">
                         <div className="font-semibold text-slate-900 flex items-center gap-2">
                           {r.authorName} <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">Empresa Verificada</Badge>
                         </div>
                         <div className="text-sm text-slate-400">{r.date}</div>
                       </div>
                       <div className="flex text-amber-500 mb-2">
                         {[...Array(5)].map((_, i) => (
                           <Star key={i} className={`w-4 h-4 ${i < r.rating ? "fill-amber-500" : "text-amber-200 fill-amber-50"}`} />
                         ))}
                       </div>
                       <p className="text-slate-600 text-sm">"{r.comment}"</p>
                     </div>
                   ))}
                 </div>
               )}
             </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-8">
            <Card className="p-6">
              <h3 className="font-bold text-slate-900 mb-4">Contacto Directo</h3>
              <p className="text-sm text-slate-500 mb-6">Ponte en contacto con el profesional para solicitar presupuestos o visitas técnicas.</p>
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start h-12 text-slate-700 bg-slate-50 border-slate-200">
                  <Phone className="w-4 h-4 mr-3 text-slate-400" />
                  {provider.phone}
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 text-slate-700 bg-slate-50 border-slate-200">
                  <Mail className="w-4 h-4 mr-3 text-slate-400" />
                  Enviar Correo Electrónico
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
