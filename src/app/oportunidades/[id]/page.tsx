"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, MapPin, Building2, Briefcase, Share2, CheckCircle2, User, Sparkles, TrendingUp, Info, Tag } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { oportunidadesService, Oportunidad, Match } from "@/modulos/oportunidades/servicio-oportunidades";
import DialogoPostularse from "./DialogoPostularse";
import { miPostulacionEnOportunidad } from "./acciones";


export default function OportunidadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentUser } = useAuth();

  const [op, setOp] = useState<Oportunidad | null>(null);
  const [candidates, setCandidates] = useState<Match[]>([]);
  const [myMatch, setMyMatch] = useState<Match | null>(null);
  const [miPostulacion, setMiPostulacion] = useState<{ id: string; estado: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const isProveedor = currentUser?.role === "provider";
  const isOwner = Boolean(
    currentUser?.entityId && op && (
      op.empresa_solicitante_id === currentUser.entityId ||
      op.proveedor_solicitante_id === currentUser.entityId
    )
  );

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const data = await oportunidadesService.getOportunidadById(id);
        if (!isMounted) return;
        setOp(data);

        const esDueno = currentUser?.entityId && (
          data?.empresa_solicitante_id === currentUser.entityId ||
          data?.proveedor_solicitante_id === currentUser.entityId
        );

        const tasks: Promise<void>[] = [];

        if (esDueno) {
          tasks.push(
            oportunidadesService.getMatchesForOportunidad(id).then((m) => {
              if (isMounted) setCandidates(m);
            })
          );
        }

        if (currentUser?.entityId && (currentUser.role === 'company' || currentUser.role === 'provider')) {
          tasks.push(
            oportunidadesService
              .getMatchesForUser(currentUser.entityId, currentUser.role)
              .then((all) => {
                const found = all.find((m) => m.oportunidad_id === id) ?? null;
                if (isMounted) setMyMatch(found);
              })
          );

          if (!esDueno) {
            tasks.push(
              miPostulacionEnOportunidad(id).then((p) => {
                if (isMounted) setMiPostulacion(p);
              })
            );
          }
        }

        await Promise.all(tasks);
      } catch (error) {
        console.error("[OportunidadDetail] Error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [id, currentUser?.entityId, currentUser?.role]);

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

  const empresasCandidatas = candidates.filter((m) => m.empresa_candidata_id);
  const proveedoresCandidatos = candidates.filter((m) => m.proveedor_candidato_id);

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-4 text-[10px] text-slate-400 mb-12 font-inter uppercase tracking-[0.2em] font-bold">
          <Link href="/" className="hover:text-primary-600 transition-colors">UIAB</Link>
          <span className="text-slate-200">/</span>
          <Link href="/oportunidades" className="hover:text-primary-600 transition-colors">Oportunidades</Link>
          <span className="text-slate-200">/</span>
          <span className="text-slate-800">Detalle</span>
        </nav>

        <Link href="/oportunidades" className="inline-flex items-center gap-3 text-slate-500 hover:text-primary-600 transition-colors mb-8 group font-inter text-sm font-bold">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver al listado</span>
        </Link>

        {/* Tarjeta de Detalle */}
        <Card className="border-none shadow-2xl rounded-sm overflow-hidden bg-white relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#00213f]" />
          <CardContent className="p-10 md:p-16">
            <div className="space-y-12">

              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  <h1 className="text-4xl md:text-5xl font-manrope font-bold text-[#00213f] tracking-tighter leading-none mb-2">
                    {op.titulo}
                  </h1>

                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-[#f2f4f6] text-[#10375c] border-none px-4 py-1.5 rounded-sm font-bold text-[10px] uppercase tracking-[0.1em]">
                      {op.estado}
                    </Badge>
                    {myMatch && !isOwner && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-none px-4 py-1.5 rounded-sm font-bold text-[10px] uppercase tracking-[0.1em] flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5" /> RECOMENDADO · {Math.round(myMatch.puntaje)} PTS
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div
                  className="text-lg text-slate-600 font-inter leading-relaxed max-w-3xl [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
                  dangerouslySetInnerHTML={{ __html: op.descripcion }}
                />

                <div className="flex flex-wrap gap-2 pt-4">
                  {op.categoria && (
                    <Badge className="bg-[#10375c] text-white border-none px-4 py-2 rounded-sm font-bold text-[11px] tracking-widest uppercase">
                      {op.categoria.nombre}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="h-px bg-slate-50" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Ubicación del Requerimiento</span>
                  <div className="flex items-center gap-4 p-6 bg-[#f7f9fb] rounded-sm">
                    <div className="w-12 h-12 rounded-sm bg-white flex items-center justify-center shadow-sm">
                      <MapPin className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-[#00213f] font-manrope font-bold text-lg leading-none">{op.localidad}</p>
                      <p className="text-slate-400 text-xs font-inter mt-1 leading-none">Miembro UIAB</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Entidad Solicitante</span>
                  <div className="flex items-center gap-4 p-6 bg-[#f7f9fb] rounded-sm">
                    <div className="w-12 h-12 rounded-sm bg-white flex items-center justify-center shadow-sm">
                      <Building2 className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-[#00213f] font-manrope font-bold text-lg leading-none">{op.empresa?.razon_social || "Miembro del Parque"}</p>
                      <p className="text-slate-400 text-xs font-inter mt-1 leading-none">Verificado UIAB</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logística extra */}
              {(op.cantidad || op.unidad || op.fecha_necesidad) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {op.cantidad != null && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Cantidad</span>
                      <p className="text-[#00213f] font-manrope font-bold text-lg">{op.cantidad} {op.unidad ?? ''}</p>
                    </div>
                  )}
                  {op.fecha_necesidad && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Fecha de necesidad</span>
                      <p className="text-[#00213f] font-manrope font-bold text-lg">{new Date(op.fecha_necesidad).toLocaleDateString('es-AR')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Detalle de match para candidato */}
              {myMatch && !isOwner && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-sm p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-manrope font-bold text-[#00213f] text-sm">Por qué te recomendamos esta oportunidad</h4>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{myMatch.motivo_match}</p>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-white rounded-sm p-3 border border-emerald-100">
                      <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Categoría</span>
                      <p className="text-[#00213f] font-bold text-lg">{myMatch.detalle_puntaje.categoria}</p>
                    </div>
                    <div className="bg-white rounded-sm p-3 border border-emerald-100">
                      <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Etiquetas</span>
                      <p className="text-[#00213f] font-bold text-lg">{myMatch.detalle_puntaje.tags}</p>
                    </div>
                    <div className="bg-white rounded-sm p-3 border border-emerald-100">
                      <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Ubicación</span>
                      <p className="text-[#00213f] font-bold text-lg">{myMatch.detalle_puntaje.ubicacion}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Acciones para candidatos */}
              {!isOwner && currentUser?.entityId && (currentUser.role === 'company' || currentUser.role === 'provider') && op.estado === 'abierta' && (
                <div className="pt-12 border-t border-slate-50 flex flex-col sm:flex-row gap-6 items-center">
                  <DialogoPostularse
                    oportunidadId={op.id}
                    tituloOportunidad={op.titulo}
                    sugerenciaCantidad={op.cantidad ?? null}
                    sugerenciaUnidad={op.unidad ?? null}
                    yaPostulado={miPostulacion}
                    onPostulado={() =>
                      setMiPostulacion({ id: "pending-refresh", estado: "enviada" })
                    }
                  />
                  <Button variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-sm border-slate-200 font-bold text-slate-600 font-inter uppercase tracking-widest text-xs">
                    <Share2 className="w-4 h-4 mr-3" />
                    Compartir
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Candidatos para el dueño */}
        {isOwner && (
          <div className="mt-16 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div>
                <h2 className="text-2xl font-manrope font-bold text-[#00213f] tracking-tight">Candidatos Recomendados</h2>
                <p className="text-slate-400 font-inter text-sm mt-1">
                  {candidates.length} resultados · ordenados por puntaje de match
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-primary-200" />
            </div>

            {candidates.length === 0 ? (
              <Card className="p-16 border-dashed border-2 border-slate-200 bg-white/50 text-center rounded-sm">
                <div className="max-w-xs mx-auto">
                  <Sparkles className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-inter font-medium leading-relaxed">
                    Todavía no hay candidatos con compatibilidad suficiente. Sumá más etiquetas para ampliar la búsqueda.
                  </p>
                </div>
              </Card>
            ) : (
              <>
                {empresasCandidatas.length > 0 && (
                  <CandidatosSection
                    titulo="Empresas"
                    icono={<Building2 className="w-5 h-5 text-primary-600" />}
                    items={empresasCandidatas}
                    tipo="empresa"
                  />
                )}
                {proveedoresCandidatos.length > 0 && (
                  <CandidatosSection
                    titulo="Particulares y Proveedores"
                    icono={<User className="w-5 h-5 text-primary-600" />}
                    items={proveedoresCandidatos}
                    tipo="proveedor"
                  />
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-20 text-center text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em] pb-12">
          <p>© {new Date().getFullYear()} Conectar UIAB — Gestión de Oportunidades Industriales</p>
        </div>
      </div>
    </div>
  );
}

function CandidatosSection({
  titulo,
  icono,
  items,
  tipo,
}: {
  titulo: string;
  icono: React.ReactNode;
  items: Match[];
  tipo: 'empresa' | 'proveedor';
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-sm bg-[#f7f9fb] flex items-center justify-center">{icono}</div>
        <h3 className="text-lg font-manrope font-bold text-[#00213f]">{titulo}</h3>
        <span className="text-slate-400 text-xs font-inter font-bold uppercase tracking-widest">
          {items.length} resultado{items.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((match) => (
          <MatchCard key={match.id} match={match} tipo={tipo} />
        ))}
      </div>
    </section>
  );
}

function MatchCard({ match, tipo }: { match: Match; tipo: 'empresa' | 'proveedor' }) {
  const nombre = tipo === 'empresa'
    ? (match.empresa?.nombre_fantasia || match.empresa?.razon_social)
    : (match.proveedor?.nombre_comercial || match.proveedor?.nombre);
  const localidad = tipo === 'empresa' ? match.empresa?.localidad : match.proveedor?.localidad;
  const subtitulo = tipo === 'empresa' ? 'Empresa verificada UIAB' : `${match.proveedor?.tipo_proveedor ?? 'Proveedor'} verificado`;

  const perfilHref = tipo === 'empresa'
    ? `/empresas/${match.empresa_candidata_id}`
    : `/proveedor/proveedores/${match.proveedor_candidato_id}`;

  return (
    <Card className="border-none bg-white p-8 rounded-sm shadow-lg hover:shadow-xl transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1 bg-[#00213f] h-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div className="w-16 h-16 bg-[#f7f9fb] rounded-sm flex items-center justify-center">
            {tipo === 'empresa' ? (
              <Building2 className="w-8 h-8 text-slate-300" />
            ) : (
              <User className="w-8 h-8 text-slate-300" />
            )}
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border-none px-3 py-1 rounded-sm font-bold text-[10px] uppercase tracking-wider">
            {Math.round(match.puntaje)} pts
          </Badge>
        </div>

        <h4 className="font-manrope font-bold text-xl text-[#00213f] mb-2 line-clamp-2">{nombre || 'Sin nombre'}</h4>
        <div className="flex items-center gap-2 text-xs font-inter text-slate-400 mb-2 font-bold uppercase tracking-widest">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          {subtitulo}
        </div>
        {localidad && (
          <div className="flex items-center gap-2 text-xs font-inter text-slate-500 mb-6">
            <MapPin className="w-3.5 h-3.5" />
            {localidad}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-6">
          <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-600">
            Categoría {match.detalle_puntaje.categoria}
          </Badge>
          {match.detalle_puntaje.tags > 0 && (
            <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-600 flex items-center gap-1">
              <Tag className="w-3 h-3" /> {match.detalle_puntaje.tags}
            </Badge>
          )}
          {match.detalle_puntaje.ubicacion > 0 && (
            <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-600">
              Misma zona
            </Badge>
          )}
        </div>

        <p className="text-sm text-slate-500 leading-relaxed font-inter mb-8 line-clamp-2">
          {match.motivo_match}
        </p>

        <div className="mt-auto">
          <Link href={perfilHref}>
            <Button className="w-full bg-[#f2f4f6] hover:bg-[#00213f] text-[#00213f] hover:text-white border-none rounded-sm h-11 font-bold font-inter text-[10px] uppercase tracking-widest transition-all">
              Ver perfil
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
