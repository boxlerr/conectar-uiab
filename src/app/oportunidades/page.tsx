"use client";

import { useEffect, useState, useMemo } from "react";
import { Briefcase, MapPin, Calendar, Clock, Filter, Search, PlusCircle, ArrowRight, Building2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { oportunidadesService, Oportunidad, Match } from "@/modulos/oportunidades/oportunidadesService";


// Remove MOCK_OPORTUNIDADES


export default function OportunidadesPage() {
  const { currentUser } = useAuth();
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const isEmpresa = currentUser?.role === "company";
  const isProveedor = currentUser?.role === "provider";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ops = await oportunidadesService.getOportunidades();
        setOportunidades(ops);
        
        if (isProveedor && currentUser?.entityId) {
          const m = await oportunidadesService.getMatchesForUser(currentUser.entityId, 'provider');
          setMatches(m);
        }
      } catch (error) {
        console.error("Error fetching opportunities:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isProveedor, currentUser?.entityId]);

  const filtrados = useMemo(() => {
    return oportunidades.filter(o => 
      o.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.empresa?.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.categoria?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, oportunidades]);

  const recommendedIds = useMemo(() => new Set(matches.map(m => m.oportunidad_id)), [matches]);


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
              <h1 className="font-manrope text-4xl md:text-5xl font-bold mb-4 tracking-tighter">Oportunidades de Trabajo</h1>
              <p className="text-slate-400 text-lg font-inter">
                Conectamos la demanda de las empresas del parque con la oferta de servicios profesionales y técnicos especializados.
              </p>
            </div>
            
            {isEmpresa && (
              <Button size="lg" className="bg-[#00213f] hover:bg-[#10375c] h-14 px-8 rounded-sm font-bold transition-all hover:-translate-y-0.5 shadow-xl shadow-black/20 border-none">
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-manrope text-2xl font-bold text-slate-900 tracking-tight">
                {filtrados.length} {filtrados.length === 1 ? "oportunidad disponible" : "oportunidades disponibles"}
              </h2>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="h-40 bg-white/50 animate-pulse border-none rounded-sm" />
                ))}
              </div>
            ) : filtrados.length > 0 ? (
              filtrados.map((op) => {
                const match = matches.find(m => m.oportunidad_id === op.id);
                const isRecommended = !!match;

                return (
                  <Link key={op.id} href={`/oportunidades/${op.id}`}>
                    <Card className={`transition-all duration-300 border-none rounded-sm overflow-hidden group mb-6 relative ${
                      isRecommended ? 'bg-white ring-2 ring-primary-100 shadow-lg shadow-primary-900/5' : 'bg-white shadow-sm'
                    }`}>
                      {isRecommended && (
                        <div className="absolute top-0 right-0 bg-[#00213f] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 z-10">
                          <Sparkles className="w-3 h-3" /> Recomendado ({Math.round(match.puntaje)}%)
                        </div>
                      )}
                      <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2 text-primary-600 font-bold text-xs uppercase tracking-widest">
                              <span className={`flex h-2.5 w-2.5 rounded-full ${op.estado === 'abierta' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                              {op.estado}
                            </div>
                            <h3 className="text-2xl font-manrope font-bold text-slate-900 group-hover:text-primary-600 transition-colors leading-tight">{op.titulo}</h3>
                            <p className="text-sm font-inter text-slate-500 flex items-center mt-2 font-medium">
                              <Building2 className="w-4 h-4 mr-2 opacity-60" />
                              {op.empresa?.razon_social || "Empresa del parque"}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-slate-600 mb-8 line-clamp-2 text-base font-inter leading-relaxed">
                          {op.descripcion}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-8">
                          {op.categoria && (
                            <Badge className="bg-[#f2f4f6] text-[#10375c] hover:bg-slate-200 border-none px-4 py-1.5 rounded-sm font-bold text-[10px] uppercase tracking-wider">
                              {op.categoria.nombre}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-50 text-sm font-inter text-slate-400">
                          <div className="flex items-center gap-6">
                            <span className="flex items-center gap-2 font-medium">
                              <MapPin className="w-4 h-4 opacity-50" />
                              {op.localidad}
                            </span>
                          </div>
                          <span className="font-bold text-primary-600 flex items-center gap-1.5 transition-all group-hover:translate-x-1">
                            Ver detalles <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
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
          <div className="lg:col-span-1 space-y-8">
            <Card className="bg-[#00213f] text-white border-none shadow-2xl rounded-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-16 -mt-16 rounded-full blur-2xl" />
              <CardHeader className="p-8">
                <CardTitle className="font-manrope text-2xl font-bold tracking-tight">¿Tienes una necesidad?</CardTitle>
                <CardDescription className="text-slate-400 font-inter text-base mt-2">
                  Publica tus requerimientos técnicos y nuestro algoritmo encontrará a los proveedores ideales.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <ul className="space-y-4 text-sm font-inter">
                  <li className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary-100/10 flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-slate-300">Algoritmo de match inteligente</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary-100/10 flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-slate-300">Proveedores auditados por UIAB</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button className="w-full bg-white text-[#00213f] hover:bg-slate-100 font-bold border-none h-12 rounded-sm shadow-lg">
                  Publicar ahora
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-none bg-[#f2f4f6] rounded-sm p-8">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="font-manrope text-lg font-bold text-slate-900 uppercase tracking-wider">Sectores Clave</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex flex-wrap gap-2">
                {["Mantenimiento", "Metalurgia", "Logística", "Química", "Electricidad", "Sistemas"].map(cat => (
                  <Badge key={cat} className="bg-white text-[#10375c] border-none shadow-sm px-4 py-2 rounded-sm font-bold text-[10px] uppercase tracking-widest hover:bg-white/80 transition-colors cursor-pointer">
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
