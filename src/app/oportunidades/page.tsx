"use client";

import { useState, useMemo } from "react";
import { Briefcase, MapPin, Calendar, Clock, Filter, Search, PlusCircle, ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Datos de ejemplo para las oportunidades
const MOCK_OPORTUNIDADES = [
  {
    id: "1",
    titulo: "Torneado CNC",
    empresa: "Metalurgica Longchamps SRL",
    descripcion: "Se requiere servicio de tornería para piezas de precisión en acero inoxidable.",
    ubicacion: "Longchamps",
    distancia: "30 km radio",
    fechaPublicacion: "Publicada hoy",
    urgencia: "alta",
    tags: ["Torneado CNC", "Metalurgia", "Mecanizado"],
    estado: "Publicada"
  },
  {
    id: "2",
    titulo: "Mantenimiento Eléctrico Industrial",
    empresa: "Alimentos del Sur S.A.",
    descripcion: "Buscamos técnico electricista para mantenimiento preventivo de líneas de producción.",
    ubicacion: "Parque Industrial Burzaco",
    distancia: "5 km radio",
    fechaPublicacion: "Hace 2 días",
    urgencia: "media",
    tags: ["Electricidad", "Mantenimiento", "PLC"],
    estado: "Publicada"
  },
  {
    id: "3",
    titulo: "Soldadura Especializada",
    empresa: "Logística Avanzada",
    descripcion: "Reparación de estructuras metálicas en depósitos. Soldadura MIG/MAG.",
    ubicacion: "Adrogué",
    distancia: "10 km radio",
    fechaPublicacion: "Hace 1 semana",
    urgencia: "baja",
    tags: ["Soldadura", "Herrería", "Estructuras"],
    estado: "Publicada"
  }
];

export default function OportunidadesPage() {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const isEmpresa = currentUser?.role === "company";
  const isProveedor = currentUser?.role === "provider";

  const filtrados = useMemo(() => {
    return MOCK_OPORTUNIDADES.filter(o => 
      o.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16">
      {/* Hero / Header Section */}
      <div className="bg-slate-900 text-white py-16 mb-12 -mt-24 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 mb-4 shadow-lg shadow-primary-900/50">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h1 className="font-poppins text-4xl md:text-5xl font-bold mb-4">Oportunidades de Trabajo</h1>
              <p className="text-slate-400 text-lg">
                Conectamos la demanda de las empresas del parque con la oferta de servicios profesionales y técnicos especializados.
              </p>
            </div>
            
            {isEmpresa && (
              <Button size="lg" className="bg-primary-600 hover:bg-primary-700 h-14 px-8 rounded-xl font-bold transition-all hover:-translate-y-1 shadow-xl shadow-primary-600/20">
                <PlusCircle className="mr-2 h-5 w-5" />
                Publicar Oportunidad
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search and Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Buscar por título, empresa o especialidad..." 
              className="pl-10 h-12 bg-white border-slate-200 rounded-xl focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700">
            <Filter className="mr-2 h-5 w-5" />
            Filtros
          </Button>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-poppins text-xl font-bold text-slate-800">
                {filtrados.length} {filtrados.length === 1 ? "oportunidad disponible" : "oportunidades disponibles"}
              </h2>
            </div>

            {filtrados.length > 0 ? (
              filtrados.map((op) => (
                <Link key={op.id} href={`/oportunidades/${op.id}`}>
                  <Card className="hover:shadow-md transition-all duration-300 border-slate-200/60 overflow-hidden group mb-4">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1 text-primary-600 font-bold text-sm uppercase tracking-wider">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            {op.estado}
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{op.titulo}</h3>
                          <p className="text-sm text-slate-500 flex items-center mt-1">
                            <Building2 className="w-4 h-4 mr-1.5 opacity-70" />
                            {op.empresa}
                          </p>
                        </div>
                        <Badge variant={op.urgencia === "alta" ? "destructive" : op.urgencia === "media" ? "secondary" : "outline"} className="capitalize">
                          Urgencia {op.urgencia}
                        </Badge>
                      </div>
                      
                      <p className="text-slate-600 mb-6 line-clamp-2">
                        {op.descripcion}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {op.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none px-3 py-1 font-medium">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-sm text-slate-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {op.ubicacion} ({op.distancia})
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {op.fechaPublicacion}
                          </span>
                        </div>
                        <span className="font-semibold text-primary-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Ver detalle <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="p-12 text-center border-dashed border-2">
                <CardContent>
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No se encontraron oportunidades que coincidan con tu búsqueda.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar / Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gradient-to-br from-primary-600 to-indigo-700 text-white border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">¿Eres una empresa?</CardTitle>
                <CardDescription className="text-primary-100">
                  Publica tus necesidades de servicios y encuentra al proveedor ideal en nuestra red industrial.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="mt-1 rounded-full bg-white/20 p-0.5">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                    <span>Acceso a +100 proveedores calificados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 rounded-full bg-white/20 p-0.5">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                    <span>Gestión centralizada de postulaciones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 rounded-full bg-white/20 p-0.5">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                    <span>Algoritmo de match por especialidad</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-white text-primary-700 hover:bg-primary-50 font-bold border-none">
                  Saber más
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Categorías populares</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {["Mantenimiento", "Metalurgia", "Logística", "Electricidad", "Sistemas", "Diseño", "Soldadura", "Construcción"].map(cat => (
                  <Badge key={cat} variant="outline" className="cursor-pointer hover:bg-slate-50">
                    {cat}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
