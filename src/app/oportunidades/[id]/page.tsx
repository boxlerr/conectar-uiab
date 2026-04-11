"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, MapPin, Building2, Briefcase, Calendar, Clock, Share2, MoreVertical, CheckCircle2, User, Sparkles, TrendingUp, Info } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { oportunidadesService, Oportunidad, Match } from "@/modulos/oportunidades/servicio-oportunidades";


// Remove MOCK_OPORTUNIDADES


export default function OportunidadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentUser } = useAuth();
  
  const [op, setOp] = useState<Oportunidad | null>(null);
  const [candidates, setCandidates] = useState<Match[]>([]);
  const [myMatch, setMyMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  const isProveedor = currentUser?.role === "provider";
  const isOwner = op?.empresa_solicitante_id === currentUser?.entityId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await oportunidadesService.getOportunidadById(id);
        setOp(data);

        if (data.empresa_solicitante_id === currentUser?.entityId) {
          const m = await oportunidadesService.getMatchesForOportunidad(id);
          setCandidates(m);
        }

        if (isProveedor && currentUser?.entityId) {
          const allMatches = await oportunidadesService.getMatchesForUser(currentUser.entityId, 'provider');
          const found = allMatches.find(m => m.oportunidad_id === id);
          if (found) setMyMatch(found);
        }
      } catch (error) {
        console.error("Error fetching detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, currentUser?.entityId, isProveedor]);

  if (loading) return (
    <div className="min-h-screen bg-[#f7f9fb] pt-24 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <Briefcase className="w-12 h-12 text-slate-200 mb-4" />
        <p className="text-slate-400 font-inter font-medium tracking-wide">Cargando oportunidad...</p>
      </div>
    </div>
  );

  if (!op) return (
    <div className="min-h-screen bg-[#f7f9fb] pt-24 flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 border-none bg-white rounded-sm text-center shadow-lg">
        <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-manrope font-bold text-slate-900 mb-2">No se encontró la oportunidad</h2>
        <Link href="/oportunidades">
          <Button className="mt-4 bg-[#00213f] rounded-sm h-12 px-8">Volver al listado</Button>
        </Link>
      </Card>
    </div>
  );


  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Breadcrumbs - Estilo similar al de la imagen */}
        <nav className="flex items-center gap-4 text-[10px] text-slate-400 mb-12 font-inter uppercase tracking-[0.2em] font-bold">
          <Link href="/" className="hover:text-primary-600 transition-colors">UIAB</Link>
          <span className="text-slate-200">/</span>
          <Link href="/oportunidades" className="hover:text-primary-600 transition-colors">Oportunidades</Link>
          <span className="text-slate-200">/</span>
          <span className="text-slate-800">Detalle</span>
        </nav>

        {/* Botón Volver */}
        <Link href="/oportunidades" className="inline-flex items-center gap-3 text-slate-500 hover:text-primary-600 transition-colors mb-8 group font-inter text-sm font-bold">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver al listado</span>
        </Link>

        {/* Tarjeta de Detalle - Reflejando fielmente la imagen */}
        <Card className="border-none shadow-2xl rounded-sm overflow-hidden bg-white relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#00213f]" />
          <CardContent className="p-10 md:p-16">
            <div className="space-y-12">
              
              {/* Encabezado: Título y Badges */}
              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  <h1 className="text-4xl md:text-5xl font-manrope font-bold text-[#00213f] tracking-tighter leading-none mb-2">
                    {op.titulo}
                  </h1>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-[#f2f4f6] text-[#10375c] border-none px-4 py-1.5 rounded-sm font-bold text-[10px] uppercase tracking-[0.1em]">
                      {op.estado}
                    </Badge>
                    {isProveedor && myMatch && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-none px-4 py-1.5 rounded-sm font-bold text-[10px] uppercase tracking-[0.1em] flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5" /> RECOMENDADO - {Math.round(myMatch.puntaje)}% de coincidencia
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-4">
                <p className="text-lg text-slate-600 font-inter leading-relaxed max-w-3xl">
                  {op.descripcion}
                </p>
                
                <div className="flex flex-wrap gap-2 pt-4">
                  {op.categoria && (
                    <Badge className="bg-[#10375c] text-white border-none px-4 py-2 rounded-sm font-bold text-[11px] tracking-widest uppercase">
                      {op.categoria.nombre}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="h-px bg-slate-50" />

              {/* Información Logística */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Ubicación del Requerimiento</span>
                  <div className="flex items-center gap-4 p-6 bg-[#f7f9fb] rounded-sm group hover:bg-[#f2f4f6] transition-colors">
                    <div className="w-12 h-12 rounded-sm bg-white flex items-center justify-center shadow-sm">
                      <MapPin className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-[#00213f] font-manrope font-bold text-lg leading-none">{op.localidad}</p>
                      <p className="text-slate-400 text-xs font-inter mt-1 leading-none">Burzaco, Almirante Brown</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Entidad Solicitante</span>
                  <div className="flex items-center gap-4 p-6 bg-[#f7f9fb] rounded-sm group hover:bg-[#f2f4f6] transition-colors">
                    <div className="w-12 h-12 rounded-sm bg-white flex items-center justify-center shadow-sm">
                      <Building2 className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-[#00213f] font-manrope font-bold text-lg leading-none">{op.empresa?.razon_social || "Empresa del Parque"}</p>
                      <p className="text-slate-400 text-xs font-inter mt-1 leading-none">Miembro verificado UIAB</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección de Acción para Proveedores */}
              {isProveedor && (
                <div className="pt-12 border-t border-slate-50 flex flex-col sm:flex-row gap-6 items-center">
                  <Button className="w-full sm:w-80 bg-[#00213f] hover:bg-[#10375c] text-white font-bold h-14 rounded-sm shadow-xl shadow-primary-900/10 transition-all font-inter uppercase tracking-widest text-xs">
                    Postularse a esta oportunidad
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-sm border-slate-200 font-bold text-slate-600 font-inter uppercase tracking-widest text-xs">
                    <Share2 className="w-4 h-4 mr-3" />
                    Compartir
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sección de Matches para la Empresa Dueña */}
        {isOwner && (
          <div className="mt-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div>
                <h2 className="text-2xl font-manrope font-bold text-[#00213f] tracking-tight">Proveedores Recomendados</h2>
                <p className="text-slate-400 font-inter text-sm mt-1">Algoritmo de match basado en especialidad y cercanía.</p>
              </div>
              <Sparkles className="w-8 h-8 text-primary-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.length > 0 ? (
                candidates.map((match) => (
                  <Card key={match.id} className="border-none bg-white p-8 rounded-sm shadow-lg hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-1 bg-[#00213f] h-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 bg-[#f7f9fb] rounded-sm flex items-center justify-center">
                          <User className="w-8 h-8 text-slate-300" />
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border-none px-3 py-1 rounded-sm font-bold text-[10px] uppercase tracking-wider">
                          {Math.round(match.puntaje)}% Match
                        </Badge>
                      </div>
                      
                      <h4 className="font-manrope font-bold text-xl text-[#00213f] mb-2">{match.proveedor?.nombre_comercial || match.proveedor?.nombre}</h4>
                      <div className="flex items-center gap-2 text-xs font-inter text-slate-400 mb-6 font-bold uppercase tracking-widest">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {match.proveedor?.tipo_proveedor} verificado
                      </div>

                      <p className="text-sm text-slate-500 leading-relaxed font-inter mb-8 line-clamp-3">
                        {match.motivo_match}
                      </p>

                      <div className="mt-auto">
                        <Button className="w-full bg-[#f2f4f6] hover:bg-[#00213f] text-[#00213f] hover:text-white border-none rounded-sm h-11 font-bold font-inter text-[10px] uppercase tracking-widest transition-all">
                          Ver Perfil del Proveedor
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full p-16 border-dashed border-2 border-slate-200 bg-white/50 text-center rounded-sm">
                  <div className="max-w-xs mx-auto">
                    <Sparkles className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-inter font-medium leading-relaxed">
                      Estamos analizando nuevos proveedores para tu requerimiento. Te avisaremos cuando encontremos el match perfecto.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Footer info adicional */}
        <div className="mt-20 text-center text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em] pb-12">
          <p>© {new Date().getFullYear()} Conectar UIAB — Gestión de Oportunidades Industriales</p>
        </div>
      </div>
    </div>
  );
}

