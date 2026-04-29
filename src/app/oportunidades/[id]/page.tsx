"use client";

import { useEffect, useState, use } from "react";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Briefcase,
  Share2,
  CheckCircle2,
  User,
  Sparkles,
  TrendingUp,
  Info,
  Tag,
  Package,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  oportunidadesService,
  Oportunidad,
  Match,
} from "@/modulos/oportunidades/servicio-oportunidades";
import DialogoPostularse from "./DialogoPostularse";
import { miPostulacionEnOportunidad } from "./acciones";

export default function OportunidadDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { currentUser } = useAuth();

  const [op, setOp] = useState<Oportunidad | null>(null);
  const [candidates, setCandidates] = useState<Match[]>([]);
  const [myMatch, setMyMatch] = useState<Match | null>(null);
  const [miPostulacion, setMiPostulacion] = useState<{
    id: string;
    estado: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwner = Boolean(
    currentUser?.entityId &&
      op &&
      (op.empresa_solicitante_id === currentUser.entityId ||
        op.proveedor_solicitante_id === currentUser.entityId)
  );

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const data = await oportunidadesService.getOportunidadById(id);
        if (!isMounted) return;
        setOp(data);

        const esDueno =
          currentUser?.entityId &&
          (data?.empresa_solicitante_id === currentUser.entityId ||
            data?.proveedor_solicitante_id === currentUser.entityId);

        const tasks: Promise<void>[] = [];

        if (esDueno) {
          tasks.push(
            oportunidadesService.getMatchesForOportunidad(id).then((m) => {
              if (isMounted) setCandidates(m);
            })
          );
        }

        if (
          currentUser?.entityId &&
          (currentUser.role === "company" || currentUser.role === "provider")
        ) {
          tasks.push(
            oportunidadesService
              .getMatchesForUser(currentUser.entityId, currentUser.role)
              .then((all) => {
                const found =
                  all.find((m) => m.oportunidad_id === id) ?? null;
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
    return () => {
      isMounted = false;
    };
  }, [id, currentUser?.entityId, currentUser?.role]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#f7f9fb] pt-24 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Briefcase className="w-12 h-12 text-slate-200 mb-4" />
          <p className="text-slate-400 font-inter font-medium tracking-wide">
            Cargando oportunidad...
          </p>
        </div>
      </div>
    );

  if (!op)
    return (
      <div className="min-h-screen bg-[#f7f9fb] pt-24 flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 border-none bg-white rounded-sm text-center shadow-lg">
          <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-manrope font-bold text-slate-900 mb-2">
            No se encontró la oportunidad
          </h2>
          <Link href="/oportunidades">
            <Button className="mt-4 bg-[#00213f] rounded-sm h-12 px-8">
              Volver al listado
            </Button>
          </Link>
        </Card>
      </div>
    );

  const empresasCandidatas = candidates.filter((m) => m.empresa_candidata_id);
  const proveedoresCandidatos = candidates.filter(
    (m) => m.proveedor_candidato_id
  );

  const puedePostularse =
    !isOwner &&
    currentUser?.entityId &&
    (currentUser.role === "company" || currentUser.role === "provider") &&
    op.estado === "abierta";

  const fechaFmt = op.fecha_necesidad
    ? new Date(op.fecha_necesidad).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* TOP NAV STRIP */}
      <div className="bg-[#00213f] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <nav className="flex items-center gap-2.5 text-[10px] text-white/50 font-inter uppercase tracking-[0.22em] font-bold">
            <Link href="/" className="hover:text-white transition-colors">UIAB</Link>
            <span className="text-white/20">/</span>
            <Link href="/oportunidades" className="hover:text-white transition-colors">Oportunidades</Link>
            <span className="text-white/20">/</span>
            <span className="text-white">Detalle</span>
          </nav>
          <Link
            href="/oportunidades"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors group font-inter text-[10px] font-bold uppercase tracking-[0.22em]"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Volver al listado</span>
          </Link>
        </div>
      </div>

      {/* MASTHEAD — editorial */}
      <header data-tour="op-detalle-hero" className="bg-[#00213f] text-white relative overflow-hidden border-t border-white/5">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #ffffff 1px, transparent 1px), linear-gradient(45deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Vertical accent rule */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/10 hidden lg:block" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16 relative">
          {/* Top meta line: folio · category · estado */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8 text-[10px] font-inter font-bold uppercase tracking-[0.22em]">
            <span className="text-white/40 tabular-nums">
              Folio · #{op.id.slice(0, 6).toUpperCase()}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-white/90">Oportunidad {op.estado}</span>
            {op.categoria && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-white/90">{op.categoria.nombre}</span>
              </>
            )}
            {myMatch && !isOwner && (
              <span className="ml-auto inline-flex items-center gap-1.5 text-emerald-300">
                <TrendingUp className="w-3 h-3" />
                Recomendado · {Math.round(myMatch.puntaje)} pts
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-[5.5rem] font-manrope font-bold text-white tracking-[-0.03em] leading-[0.92] max-w-5xl">
            {op.titulo}
          </h1>

          {/* Meta row */}
          <div data-tour="op-detalle-meta" className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/10 max-w-3xl">
            <MetaCell
              label="Solicitante"
              value={op.empresa?.razon_social || "Miembro del Parque"}
              icon={<Building2 className="w-4 h-4" />}
              accent="amber"
            />
            <MetaCell
              label="Ubicación"
              value={op.localidad}
              icon={<MapPin className="w-4 h-4" />}
              accent="sky"
            />
            <MetaCell
              label="Necesidad"
              value={fechaFmt ?? "A coordinar"}
              icon={<CalendarDays className="w-4 h-4" />}
              accent="emerald"
            />
          </div>
        </div>
      </header>

      {/* BODY — two-column ledger */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-12 gap-8 lg:gap-12">
          {/* MAIN COLUMN */}
          <main className="col-span-12 lg:col-span-8 space-y-12">
            {/* Mobile-only CTA — pinned near top so it's not hidden */}
            {puedePostularse && (
              <div className="lg:hidden">
                <DialogoPostularse
                  oportunidadId={op.id}
                  tituloOportunidad={op.titulo}
                  sugerenciaCantidad={op.cantidad ?? null}
                  sugerenciaUnidad={op.unidad ?? null}
                  yaPostulado={miPostulacion}
                  onPostulado={() =>
                    setMiPostulacion({
                      id: "pending-refresh",
                      estado: "enviada",
                    })
                  }
                />
              </div>
            )}

            {/* Description block */}
            <section data-tour="op-detalle-descripcion">
              <div className="flex items-baseline gap-4 mb-5">
                <span className="text-[10px] font-bold text-[#10375c] uppercase tracking-[0.22em] font-inter tabular-nums">
                  01
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.22em] font-inter">
                  Descripción del requerimiento
                </span>
                <span className="flex-1 h-px bg-slate-200/60" />
              </div>
              <div className="bg-white p-8 lg:p-10 rounded-sm relative">
                <div className="absolute top-0 left-0 w-12 h-1 bg-[#00213f]" />
                <div
                  className="text-base lg:text-lg text-slate-700 font-inter leading-[1.75] [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_strong]:text-[#00213f] [&_strong]:font-bold"
                  dangerouslySetInnerHTML={{ __html: op.descripcion }}
                />
              </div>
            </section>

            {/* Match recommendation */}
            {myMatch && !isOwner && (
              <section>
                <div className="flex items-baseline gap-4 mb-6">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-[0.22em] font-inter">
                    02 — Por qué te recomendamos
                  </span>
                  <span className="flex-1 h-px bg-emerald-100" />
                </div>
                <div className="bg-white p-8 rounded-sm">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 rounded-sm bg-emerald-50 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-base text-slate-700 font-inter leading-relaxed flex-1">
                      {myMatch.motivo_match}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-px bg-slate-100 mt-6">
                    <ScoreCell
                      label="Categoría"
                      value={myMatch.detalle_puntaje.categoria}
                    />
                    <ScoreCell
                      label="Etiquetas"
                      value={myMatch.detalle_puntaje.tags}
                    />
                    <ScoreCell
                      label="Ubicación"
                      value={myMatch.detalle_puntaje.ubicacion}
                    />
                  </div>
                </div>
              </section>
            )}
          </main>

          {/* LEDGER SIDEBAR — sticky on desktop */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-3">
              {/* Action card */}
              {puedePostularse && (
                <div data-tour="op-detalle-postular" className="hidden lg:block bg-white p-6 rounded-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em] mb-4 font-inter">
                    Acción
                  </p>
                  <DialogoPostularse
                    oportunidadId={op.id}
                    tituloOportunidad={op.titulo}
                    sugerenciaCantidad={op.cantidad ?? null}
                    sugerenciaUnidad={op.unidad ?? null}
                    yaPostulado={miPostulacion}
                    onPostulado={() =>
                      setMiPostulacion({
                        id: "pending-refresh",
                        estado: "enviada",
                      })
                    }
                  />
                  <button className="mt-3 w-full h-11 inline-flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-[#00213f] transition-colors font-inter">
                    <Share2 className="w-3.5 h-3.5" />
                    Compartir oportunidad
                  </button>
                </div>
              )}

              {/* Ledger panel — facts stacked, separated by surface shift */}
              <div data-tour="op-detalle-ficha" className="bg-white rounded-sm overflow-hidden">
                <div className="bg-[#10375c] px-6 py-4">
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.22em] font-inter">
                    Ficha técnica
                  </p>
                </div>

                <LedgerRow
                  icon={<MapPin className="w-4 h-4" />}
                  label="Ubicación"
                  value={op.localidad}
                  subtitle="Miembro UIAB"
                />
                <LedgerRow
                  icon={<Building2 className="w-4 h-4" />}
                  label="Solicitante"
                  value={op.empresa?.razon_social || "Miembro del Parque"}
                  subtitle="Verificado UIAB"
                  alt
                />
                {op.cantidad != null && (
                  <LedgerRow
                    icon={<Package className="w-4 h-4" />}
                    label="Cantidad"
                    value={`${op.cantidad}${op.unidad ? ` ${op.unidad}` : ""}`}
                  />
                )}
                {fechaFmt && (
                  <LedgerRow
                    icon={<CalendarDays className="w-4 h-4" />}
                    label="Fecha de necesidad"
                    value={fechaFmt}
                    alt
                  />
                )}
                {op.categoria && (
                  <LedgerRow
                    icon={<Tag className="w-4 h-4" />}
                    label="Categoría"
                    value={op.categoria.nombre}
                  />
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* CANDIDATES — owner view */}
        {isOwner && (
          <section className="mt-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-baseline gap-4 mb-10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em] font-inter">
                03 — Candidatos recomendados
              </span>
              <span className="flex-1 h-px bg-slate-200/60" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.22em] tabular-nums">
                {String(candidates.length).padStart(2, "0")} resultados
              </span>
            </div>

            {candidates.length === 0 ? (
              <div className="bg-white p-16 text-center rounded-sm">
                <Sparkles className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-inter font-medium leading-relaxed max-w-sm mx-auto">
                  Todavía no hay candidatos con compatibilidad suficiente.
                  Sumá más etiquetas para ampliar la búsqueda.
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {empresasCandidatas.length > 0 && (
                  <CandidatosSection
                    titulo="Empresas"
                    icono={
                      <Building2 className="w-4 h-4 text-[#10375c]" />
                    }
                    items={empresasCandidatas}
                    tipo="empresa"
                  />
                )}
                {proveedoresCandidatos.length > 0 && (
                  <CandidatosSection
                    titulo="Proveedores de servicios"
                    icono={<User className="w-4 h-4 text-[#10375c]" />}
                    items={proveedoresCandidatos}
                    tipo="proveedor"
                  />
                )}
              </div>
            )}
          </section>
        )}

        <footer className="mt-24 text-center text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em] pb-4 font-inter">
          © {new Date().getFullYear()} Conectar UIAB — Gestión de Oportunidades Industriales
        </footer>
      </div>
    </div>
  );
}

function MetaCell({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: "amber" | "sky" | "emerald";
}) {
  const dot = {
    amber: "bg-amber-300",
    sky: "bg-sky-300",
    emerald: "bg-emerald-300",
  }[accent];

  const iconColor = {
    amber: "text-amber-200/80",
    sky: "text-sky-200/80",
    emerald: "text-emerald-200/80",
  }[accent];

  return (
    <div className="bg-[#00213f] px-5 py-5">
      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] font-inter text-white/40 mb-3">
        <span className={`w-1 h-1 rounded-full ${dot}`} />
        <span>{label}</span>
      </div>
      <div className="flex items-baseline gap-2.5">
        <span className={`shrink-0 ${iconColor}`}>{icon}</span>
        <p className="font-manrope font-bold text-white text-base leading-tight truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

function LedgerRow({
  icon,
  label,
  value,
  subtitle,
  alt = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  alt?: boolean;
}) {
  return (
    <div
      className={`px-6 py-5 flex items-start gap-4 ${
        alt ? "bg-[#f2f4f6]" : "bg-white"
      }`}
    >
      <div className="w-8 h-8 rounded-sm bg-white shadow-sm flex items-center justify-center text-[#10375c] shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-1 font-inter">
          {label}
        </p>
        <p className="font-manrope font-bold text-[#00213f] text-base leading-tight break-words">
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] text-slate-400 font-inter mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function ScoreCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-4">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] font-inter mb-1">
        {label}
      </p>
      <p className="font-manrope font-bold text-[#00213f] text-2xl tabular-nums">
        {value}
      </p>
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
  tipo: "empresa" | "proveedor";
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-sm bg-[#f2f4f6] flex items-center justify-center">
          {icono}
        </div>
        <h3 className="text-base font-manrope font-bold text-[#00213f] tracking-tight">
          {titulo}
        </h3>
        <span className="text-slate-400 text-[10px] font-inter font-bold uppercase tracking-[0.22em]">
          {items.length} resultado{items.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((match) => (
          <MatchCard key={match.id} match={match} tipo={tipo} />
        ))}
      </div>
    </section>
  );
}

function MatchCard({
  match,
  tipo,
}: {
  match: Match;
  tipo: "empresa" | "proveedor";
}) {
  const nombre =
    tipo === "empresa"
      ? match.empresa?.nombre_comercial || match.empresa?.razon_social
      : match.proveedor?.nombre_comercial || match.proveedor?.nombre;
  const localidad =
    tipo === "empresa" ? match.empresa?.localidad : match.proveedor?.localidad;
  const subtitulo =
    tipo === "empresa"
      ? "Empresa verificada UIAB"
      : `${match.proveedor?.tipo_proveedor ?? "Proveedor"} verificado`;

  const perfilHref =
    tipo === "empresa"
      ? `/empresas/${match.empresa_candidata_id}`
      : `/proveedor/proveedores/${match.proveedor_candidato_id}`;

  return (
    <Card className="border-none bg-white p-6 rounded-sm shadow-sm hover:shadow-lg transition-all group overflow-hidden relative">
      <div className="absolute top-0 left-0 h-1 w-full bg-[#00213f] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-5">
          <div className="w-12 h-12 bg-[#f2f4f6] rounded-sm flex items-center justify-center">
            {tipo === "empresa" ? (
              <Building2 className="w-6 h-6 text-slate-400" />
            ) : (
              <User className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-0.5">
              Match
            </p>
            <p className="font-manrope font-bold text-[#00213f] text-xl tabular-nums leading-none">
              {Math.round(match.puntaje)}
            </p>
          </div>
        </div>

        <h4 className="font-manrope font-bold text-lg text-[#00213f] mb-1.5 line-clamp-2 leading-tight">
          {nombre || "Sin nombre"}
        </h4>
        <div className="flex items-center gap-1.5 text-[10px] font-inter text-slate-500 mb-2 font-bold uppercase tracking-[0.15em]">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          {subtitulo}
        </div>
        {localidad && (
          <div className="flex items-center gap-1.5 text-xs font-inter text-slate-500 mb-4">
            <MapPin className="w-3 h-3" />
            {localidad}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-5">
          <span className="text-[10px] font-bold text-slate-600 bg-[#f2f4f6] px-2 py-1 rounded-sm">
            Cat {match.detalle_puntaje.categoria}
          </span>
          {match.detalle_puntaje.tags > 0 && (
            <span className="text-[10px] font-bold text-slate-600 bg-[#f2f4f6] px-2 py-1 rounded-sm flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" /> {match.detalle_puntaje.tags}
            </span>
          )}
          {match.detalle_puntaje.ubicacion > 0 && (
            <span className="text-[10px] font-bold text-slate-600 bg-[#f2f4f6] px-2 py-1 rounded-sm">
              Misma zona
            </span>
          )}
        </div>

        <p className="text-sm text-slate-500 leading-relaxed font-inter mb-6 line-clamp-2 flex-1">
          {match.motivo_match}
        </p>

        <Link href={perfilHref} className="mt-auto">
          <Button className="w-full bg-[#f2f4f6] hover:bg-[#00213f] text-[#00213f] hover:text-white border-none rounded-sm h-10 font-bold font-inter text-[10px] uppercase tracking-[0.2em] transition-all">
            Ver perfil
          </Button>
        </Link>
      </div>
    </Card>
  );
}
