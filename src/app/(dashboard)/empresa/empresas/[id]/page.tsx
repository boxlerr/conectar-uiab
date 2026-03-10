"use client";

import { use } from "react";
import { mockedCompanies, mockedReviews } from "@/modulos/compartido/data/mockDB";
import { Building, MapPin, Mail, Phone, Star, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useAuth } from "@/modulos/autenticacion/AuthContext";

export default function CompanyProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentUser } = useAuth();
  
  const company = mockedCompanies.find(c => c.id === id);
  const companyReviews = mockedReviews.filter(r => r.targetId === id && r.status === "approved");

  if (!company) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Empresa no encontrada</h2>
        <Link href="/empresa/empresas">
          <Button variant="outline">Volver al directorio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Cover */}
      <div className="h-48 md:h-64 bg-slate-900 w-full relative">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-24 z-10">
        <Link href="/empresa/empresas" className="inline-flex items-center text-white/80 hover:text-white mb-6 font-medium text-sm transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Volver al directorio
        </Link>
        
        {/* Profile Header Card */}
        <Card className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center shadow-lg border-slate-200">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white border-2 border-slate-100 shadow flex items-center justify-center flex-shrink-0">
             {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logoUrl} alt={company.name} className="w-16 h-16 object-contain" />
              ) : (
                <Building className="w-12 h-12 text-slate-300" />
              )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              {company.name}
              {company.status === "approved" && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 mb-4">
              <Badge variant="secondary" className="bg-primary-50 text-primary-700">{company.category}</Badge>
              <div className="flex items-center text-amber-500 font-medium text-sm">
                 <Star className="w-4 h-4 fill-amber-500 mr-1" />
                 {company.rating} ({company.reviewCount} reseñas)
              </div>
            </div>
            <p className="text-slate-600 max-w-2xl">{company.description}</p>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
             <Card className="p-6 md:p-8">
               <h2 className="text-xl font-bold text-slate-900 mb-6">Servicios Ofrecidos</h2>
               <div className="flex flex-wrap gap-2">
                 {company.servicesOffered.map((s: string, idx: number) => (
                   <span key={idx} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                     {s}
                   </span>
                 ))}
               </div>
             </Card>
             
             <Card className="p-6 md:p-8">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-slate-900">Reseñas de Clientes</h2>
                 {currentUser && (
                   <Button size="sm">Escribir Reseña</Button>
                 )}
               </div>
               
               {companyReviews.length === 0 ? (
                 <p className="text-slate-500 italic">No hay reseñas visibles aún.</p>
               ) : (
                 <div className="space-y-6">
                   {companyReviews.map(r => (
                     <div key={r.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                       <div className="flex items-center justify-between mb-2">
                         <div className="font-semibold text-slate-900">{r.authorName}</div>
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
              <h3 className="font-bold text-slate-900 mb-4">Información de Contacto</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-slate-600 text-sm">
                  <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <span>{company.address}</span>
                </div>
                <div className="flex items-start gap-3 text-slate-600 text-sm">
                  <Phone className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <span>{company.phone}</span>
                </div>
                <div className="flex items-start gap-3 text-slate-600 text-sm">
                  <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <span>{company.contactEmail}</span>
                </div>
              </div>
              <Button className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white">Contactar Empresa</Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
