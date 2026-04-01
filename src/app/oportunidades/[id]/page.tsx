"use client";

import { use, useState } from "react";
import { ArrowLeft, MapPin, Building2, Briefcase, Calendar, Clock, Share2, MoreVertical, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Reutilizamos los datos de ejemplo
const MOCK_OPORTUNIDADES = [
  {
    id: "1",
    titulo: "Torneado CNC",
    empresa: "Metalurgica Longchamps SRL",
    descripcion: "Servicio de torno",
    ubicacion: "Longchamps",
    distancia: "30 km radio",
    fechaPublicacion: "Publicada hoy",
    urgencia: "media",
    tags: ["Torneado CNC"],
    estado: "Publicada"
  }
];

export default function OportunidadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentUser } = useAuth();
  const isProveedor = currentUser?.role === "provider";
  
  // Buscamos la oportunidad (en este caso usamos la 1 por defecto para la visualización)
  const op = MOCK_OPORTUNIDADES.find(o => o.id === id) || MOCK_OPORTUNIDADES[0];

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Breadcrumbs - Estilo similar al de la imagen */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8 font-medium">
          <Link href="/" className="hover:text-primary-600 transition-colors">UIAB</Link>
          <span className="text-slate-300 font-light">&gt;</span>
          <span className="text-slate-800">DetalleOportunidad</span>
        </nav>

        {/* Botón Volver */}
        <Link href="/oportunidades" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold">Volver</span>
        </Link>

        {/* Tarjeta de Detalle - Reflejando fielmente la imagen */}
        <Card className="border-none shadow-[0_4px_25px_rgba(0,0,0,0.05)] rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm border border-white">
          <CardContent className="p-8 md:p-12">
            <div className="space-y-8">
              
              {/* Encabezado: Título y Badges */}
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                  {op.titulo}
                </h1>
                
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wide">
                    {op.estado}
                  </Badge>
                  <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-none px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wide">
                    Urgencia {op.urgencia}
                  </Badge>
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-3">
                <p className="text-lg text-slate-600 font-medium">
                  {op.descripcion}
                </p>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {op.tags.map(tag => (
                    <Badge key={tag} className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none px-4 py-1.5 rounded-xl font-bold text-xs tracking-wide">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Información de Ubicación */}
              <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-16">
                <div className="flex items-center gap-3 text-slate-500 font-semibold group">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                    <MapPin className="w-5 h-5 opacity-70 group-hover:text-primary-600 transition-colors" />
                  </div>
                  <div>
                    <p className="text-slate-800">{op.ubicacion}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-500 font-semibold group">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary-50 transition-colors text-slate-800">
                    <span className="text-sm font-bold">{op.distancia.split(' ')[0]} {op.distancia.split(' ')[1]}</span>
                  </div>
                  <p className="text-slate-800">radio</p>
                </div>
              </div>

              {/* Publicado por */}
              <div className="flex items-center gap-3 text-slate-500 font-semibold pt-4">
                 <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 opacity-40 text-slate-900" />
                 </div>
                 <p className="text-md">
                   Publicado por <span className="text-slate-900 font-bold">{op.empresa}</span>
                 </p>
              </div>

              {/* Sección de Acción para Proveedores */}
              {isProveedor && (
                <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-center">
                  <Button className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-bold h-12 px-10 rounded-xl shadow-lg shadow-primary-600/20 transition-all hover:scale-[1.02]">
                    Postularse a esta oportunidad
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto h-12 px-6 rounded-xl border-slate-200 font-semibold text-slate-600">
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartir
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer info adicional (Opcional, no estaba en la imagen pero aporta valor) */}
        <div className="mt-12 text-center text-slate-400 text-sm font-medium">
          <p>© 2026 Red Comercial Industrial UIAB — Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
}
