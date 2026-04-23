"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Inbox,
  Building2,
  User,
  MapPin,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Eye,
  Archive,
  ExternalLink,
  Package,
  Star,
  ThumbsUp,
  Send,
  Phone,
  Mail,
  Globe,
  Clock,
} from "lucide-react";
import { crearSlug } from "@/lib/utilidades";
import { useEffect, useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/cliente";
import { toast } from "sonner";
import {
  marcarSolicitudVista,
  marcarSolicitudRespondida,
  cerrarSolicitud,
} from "./acciones";
import { cn } from "@/lib/utilidades";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Solicitud {
  id: string;
  oportunidad_id: string | null;
  mensaje: string;
  estado: "enviada" | "vista" | "respondida" | "cerrada" | "cancelada";
  enviada_en: string;
  vista_en: string | null;
  respondida_en: string | null;
  cerrada_en: string | null;
  cantidad: number | null;
  unidad: string | null;
  empresa_origen_id: string | null;
  proveedor_origen_id: string | null;
  empresa_origen?: { razon_social: string; nombre_comercial: string | null; localidad: string | null; email?: string | null; telefono?: string | null; sitio_web?: string | null } | null;
  proveedor_origen?: { nombre: string; nombre_comercial: string | null; tipo_proveedor: string; localidad: string | null; email?: string | null; telefono?: string | null; fecha_inicio_experiencia?: string | null; sitio_web?: string | null } | null;
  oportunidad?: { id: string; titulo: string } | null;
}

interface Resena {
  id: string;
  calificacion: number;
  comentario: string | null;
  creada_en: string;
  empresa_autora?: { razon_social: string; nombre_comercial: string | null; id: string } | null;
  proveedor_autor?: { nombre: string; nombre_comercial: string | null; id: string } | null;
  empresa_resenada?: { razon_social: string; nombre_comercial: string | null; id: string } | null;
  proveedor_resenado?: { nombre: string; nombre_comercial: string | null; id: string } | null;
}

// ─── Configuración ────────────────────────────────────────────────────────────

const ESTADO_CFG: Record<string, { label: string; className: string }> = {
  enviada: { label: "Nueva", className: "bg-amber-50 text-amber-700" },
  vista: { label: "Vista", className: "bg-blue-50 text-blue-700" },
  respondida: { label: "Respondida", className: "bg-emerald-50 text-emerald-700" },
  cerrada: { label: "Cerrada", className: "bg-slate-100 text-slate-500" },
  cancelada: { label: "Cancelada", className: "bg-rose-50 text-rose-700" },
};

type Seccion = "solicitudes" | "resenas_recibidas" | "resenas_enviadas";
type FiltroEstado = "todas" | "activas" | "enviada" | "vista" | "respondida" | "cerrada";

// ─── Componente principal ─────────────────────────────────────────────────────

export default function BandejaEntradaPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [isPending, startTransition] = useTransition();

  const [seccion, setSeccion] = useState<Seccion>("solicitudes");
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [resenasRecibidas, setResenasRecibidas] = useState<Resena[]>([]);
  const [resenasEnviadas, setResenasEnviadas] = useState<Resena[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filtro, setFiltro] = useState<FiltroEstado>("activas");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser?.entityId) {
      setFetching(false);
      return;
    }

    let cancel = false;

    async function load() {
      const entityId = currentUser!.entityId!;
      const role = currentUser!.role;

      // Solicitudes
      const destinoCol = role === "company" ? "empresa_destino_id" : "proveedor_destino_id";
      const { data: solData } = await supabase
        .from("solicitudes_presupuesto")
        .select(
          `id, oportunidad_id, mensaje, estado, enviada_en, vista_en, respondida_en, cerrada_en,
           cantidad, unidad, empresa_origen_id, proveedor_origen_id,
           empresa_origen:empresas!solicitudes_presupuesto_empresa_origen_id_fkey(razon_social, nombre_comercial, localidad, email, telefono, sitio_web),
           proveedor_origen:proveedores!solicitudes_presupuesto_proveedor_origen_id_fkey(nombre, nombre_comercial, tipo_proveedor, localidad, email, telefono, fecha_inicio_experiencia),
           oportunidad:oportunidades(id, titulo)`
        )
        .eq(destinoCol, entityId)
        .order("enviada_en", { ascending: false });

      // Reseñas recibidas (sobre mi entidad, estado aprobada)
      const resenadaCol = role === "company" ? "empresa_resenada_id" : "proveedor_resenado_id";
      const { data: recibidas } = await supabase
        .from("resenas")
        .select(
          `id, calificacion, comentario, creada_en,
           empresa_autora:empresa_autora_id(id, razon_social, nombre_comercial),
           proveedor_autor:proveedor_autor_id(id, nombre, nombre_comercial)`
        )
        .eq(resenadaCol, entityId)
        .eq("estado", "aprobada")
        .order("creada_en", { ascending: false });

      // Reseñas enviadas por mi entidad, ya aprobadas
      const autoraCol = role === "company" ? "empresa_autora_id" : "proveedor_autor_id";
      const { data: enviadas } = await supabase
        .from("resenas")
        .select(
          `id, calificacion, comentario, creada_en,
           empresa_resenada:empresa_resenada_id(id, razon_social, nombre_comercial),
           proveedor_resenado:proveedor_resenado_id(id, nombre, nombre_comercial)`
        )
        .eq(autoraCol, entityId)
        .eq("estado", "aprobada")
        .order("creada_en", { ascending: false });

      if (cancel) return;

      setSolicitudes((solData ?? []) as unknown as Solicitud[]);
      setResenasRecibidas((recibidas ?? []) as unknown as Resena[]);
      setResenasEnviadas((enviadas ?? []) as unknown as Resena[]);
      setFetching(false);
    }

    load();
    return () => { cancel = true; };
  }, [authLoading, currentUser?.entityId, currentUser?.role, tick]);

  const filtradas = useMemo(() => {
    if (filtro === "todas") return solicitudes;
    if (filtro === "activas") return solicitudes.filter((s) => s.estado === "enviada" || s.estado === "vista");
    return solicitudes.filter((s) => s.estado === filtro);
  }, [solicitudes, filtro]);

  const counts = useMemo(() => ({
    activas: solicitudes.filter((s) => s.estado === "enviada" || s.estado === "vista").length,
    enviada: solicitudes.filter((s) => s.estado === "enviada").length,
    vista: solicitudes.filter((s) => s.estado === "vista").length,
    respondida: solicitudes.filter((s) => s.estado === "respondida").length,
    cerrada: solicitudes.filter((s) => s.estado === "cerrada").length,
    todas: solicitudes.length,
  }), [solicitudes]);

  if (!currentUser) return null;

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const handleMarcarVista = (id: string) => {
    startTransition(async () => {
      const res = await marcarSolicitudVista(id);
      if (res.success) setTick((x) => x + 1);
      else toast.error("No se pudo actualizar", { description: res.error });
    });
  };

  const handleResponder = (id: string) => {
    startTransition(async () => {
      const res = await marcarSolicitudRespondida(id);
      if (res.success) { toast.success("Marcada como respondida"); setTick((x) => x + 1); }
      else toast.error("No se pudo actualizar", { description: res.error });
    });
  };

  const handleCerrar = (id: string) => {
    startTransition(async () => {
      const res = await cerrarSolicitud(id);
      if (res.success) { toast.success("Solicitud cerrada"); setTick((x) => x + 1); }
      else toast.error("No se pudo cerrar", { description: res.error });
    });
  };

  const SECCIONES: { k: Seccion; label: string; icon: React.ReactNode; count: number }[] = [
    { k: "solicitudes", label: "Solicitudes", icon: <Inbox className="w-4 h-4" />, count: counts.activas },
    { k: "resenas_recibidas", label: "Reseñas recibidas", icon: <Star className="w-4 h-4" />, count: resenasRecibidas.length },
    { k: "resenas_enviadas", label: "Reseñas enviadas", icon: <Send className="w-4 h-4" />, count: resenasEnviadas.length },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bandeja de Entrada</h1>
          <p className="text-slate-500 mt-1">Solicitudes y reseñas de tu actividad en la red.</p>
        </div>
      </div>

      {/* Tabs de sección */}
      <div className="flex gap-1 bg-slate-100/60 p-1 rounded-xl border border-slate-200/60 w-full overflow-x-auto">
        {SECCIONES.map(({ k, label, icon, count }) => (
          <button
            key={k}
            onClick={() => setSeccion(k)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-1 justify-center",
              seccion === k
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {icon}
            {label}
            {count > 0 && (
              <span className={cn(
                "ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                seccion === k ? "bg-primary-100 text-primary-700" : "bg-slate-200 text-slate-600"
              )}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Solicitudes ── */}
      {seccion === "solicitudes" && (
        <>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { k: "activas", label: `Activas (${counts.activas})` },
                { k: "enviada", label: `Nuevas (${counts.enviada})` },
                { k: "vista", label: `Vistas (${counts.vista})` },
                { k: "respondida", label: `Respondidas (${counts.respondida})` },
                { k: "cerrada", label: `Cerradas (${counts.cerrada})` },
                { k: "todas", label: `Todas (${counts.todas})` },
              ] as { k: FiltroEstado; label: string }[]
            ).map(({ k, label }) => (
              <button
                key={k}
                onClick={() => setFiltro(k)}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                  filtro === k
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {filtradas.length === 0 ? (
            <Card className="p-16 border-dashed border-2 border-slate-200 bg-white/50 text-center">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">
                {filtro === "activas" ? "No tenés solicitudes activas." : "No hay solicitudes en este filtro."}
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Cuando alguien se postule a una de tus oportunidades, la vas a ver acá.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtradas.map((s) => (
                <SolicitudCard
                  key={s.id}
                  s={s}
                  isPending={isPending}
                  onVista={handleMarcarVista}
                  onResponder={handleResponder}
                  onCerrar={handleCerrar}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Reseñas recibidas ── */}
      {seccion === "resenas_recibidas" && (
        <>
          {resenasRecibidas.length === 0 ? (
            <Card className="p-16 border-dashed border-2 border-slate-200 bg-white/50 text-center">
              <ThumbsUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Todavía no recibiste reseñas.</p>
              <p className="text-slate-400 text-sm mt-2">
                Cuando alguien publique una reseña sobre vos, va a aparecer acá.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {resenasRecibidas.map((r) => (
                <ResenaCard key={r.id} resena={r} modo="recibida" />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Reseñas enviadas ── */}
      {seccion === "resenas_enviadas" && (
        <>
          {resenasEnviadas.length === 0 ? (
            <Card className="p-16 border-dashed border-2 border-slate-200 bg-white/50 text-center">
              <Send className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No tenés reseñas aprobadas todavía.</p>
              <p className="text-slate-400 text-sm mt-2">
                Las reseñas que enviaste y fueron aprobadas aparecen acá.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {resenasEnviadas.map((r) => (
                <ResenaCard key={r.id} resena={r} modo="enviada" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tarjeta de solicitud ─────────────────────────────────────────────────────

function SolicitudCard({
  s,
  isPending,
  onVista,
  onResponder,
  onCerrar,
}: {
  s: Solicitud;
  isPending: boolean;
  onVista: (id: string) => void;
  onResponder: (id: string) => void;
  onCerrar: (id: string) => void;
}) {
  const cfg = ESTADO_CFG[s.estado] ?? { label: s.estado, className: "bg-slate-100 text-slate-700" };
  const esEmpresaOrigen = Boolean(s.empresa_origen_id);
  const origenNombre = esEmpresaOrigen
    ? s.empresa_origen?.nombre_comercial || s.empresa_origen?.razon_social
    : s.proveedor_origen?.nombre_comercial || s.proveedor_origen?.nombre;
  const origenLocalidad = esEmpresaOrigen ? s.empresa_origen?.localidad : s.proveedor_origen?.localidad;
  const origenTipo = esEmpresaOrigen ? "Empresa" : s.proveedor_origen?.tipo_proveedor ?? "Particular";
  const origenEmail = esEmpresaOrigen ? s.empresa_origen?.email : s.proveedor_origen?.email;
  const origenTelefono = esEmpresaOrigen ? s.empresa_origen?.telefono : s.proveedor_origen?.telefono;
  const origenWeb = esEmpresaOrigen ? s.empresa_origen?.sitio_web : s.proveedor_origen?.sitio_web;
  const origenSlug = origenNombre ? crearSlug(origenNombre) : null;
  const perfilHref = origenSlug ? `/empresas/${origenSlug}` : null;

  const anosExperiencia = !esEmpresaOrigen && s.proveedor_origen?.fecha_inicio_experiencia
    ? Math.floor((Date.now() - new Date(s.proveedor_origen.fecha_inicio_experiencia).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <Card className="p-6 border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            {esEmpresaOrigen ? <Building2 className="w-5 h-5 text-slate-500" /> : <User className="w-5 h-5 text-slate-500" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-base truncate">{origenNombre ?? "Sin nombre"}</h3>
              {perfilHref && (
                <Link href={perfilHref} target="_blank" className="text-primary-600 hover:text-primary-700 transition-colors shrink-0" title="Ver perfil">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
              <span className="font-semibold uppercase tracking-wider">{origenTipo}</span>
              {origenLocalidad && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {origenLocalidad}</span>}
              {anosExperiencia !== null && anosExperiencia > 0 && (
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {anosExperiencia} años de exp.</span>
              )}
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(s.enviada_en).toLocaleDateString("es-AR")}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
              {origenEmail && (
                <a href={`mailto:${origenEmail}`} className="flex items-center gap-1 hover:text-primary-600 transition-colors">
                  <Mail className="w-3 h-3" /> {origenEmail}
                </a>
              )}
              {origenTelefono && (
                <a href={`tel:${origenTelefono.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-1 hover:text-primary-600 transition-colors">
                  <Phone className="w-3 h-3" /> {origenTelefono}
                </a>
              )}
              {origenWeb && (
                <a href={origenWeb} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary-600 transition-colors truncate max-w-[200px]">
                  <Globe className="w-3 h-3 shrink-0" /> {origenWeb.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </div>
        <Badge className={`${cfg.className} border-none px-3 py-1 font-semibold text-[10px] uppercase tracking-wider`}>{cfg.label}</Badge>
      </div>

      {s.oportunidad && (
        <Link
          href={`/oportunidades/${s.oportunidad.id}`}
          className="flex items-center gap-2 text-xs font-semibold text-primary-700 hover:text-primary-800 bg-primary-50/60 px-3 py-2 rounded-lg mb-4 w-fit transition-colors"
        >
          <Package className="w-3.5 h-3.5" />
          <span className="truncate">Oportunidad: {s.oportunidad.titulo}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      )}

      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          <MessageSquare className="w-3 h-3" />
          Mensaje
        </div>
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{s.mensaje}</p>
        {(s.cantidad != null || s.unidad) && (
          <p className="text-xs text-slate-500 mt-3">
            <span className="font-semibold">Cantidad sugerida:</span> {s.cantidad ?? "-"} {s.unidad ?? ""}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        {perfilHref && (
          <Link href={perfilHref} target="_blank">
            <Button variant="outline" size="sm" className="text-xs">
              <User className="w-3.5 h-3.5 mr-2" /> Ver perfil
            </Button>
          </Link>
        )}
        {s.estado === "enviada" && (
          <Button variant="outline" size="sm" onClick={() => onVista(s.id)} disabled={isPending} className="text-xs">
            <Eye className="w-3.5 h-3.5 mr-2" /> Marcar como vista
          </Button>
        )}
        {(s.estado === "enviada" || s.estado === "vista") && (
          <Button size="sm" onClick={() => onResponder(s.id)} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Marcar respondida
          </Button>
        )}
        {s.estado !== "cerrada" && s.estado !== "cancelada" && (
          <Button variant="outline" size="sm" onClick={() => onCerrar(s.id)} disabled={isPending} className="text-xs text-slate-500">
            <Archive className="w-3.5 h-3.5 mr-2" /> Cerrar
          </Button>
        )}
      </div>
    </Card>
  );
}

// ─── Tarjeta de reseña ────────────────────────────────────────────────────────

function Estrellas({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn("w-4 h-4", i <= n ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")}
        />
      ))}
    </div>
  );
}

function ResenaCard({ resena, modo }: { resena: Resena; modo: "recibida" | "enviada" }) {
  const esEmpresaAutora = Boolean(resena.empresa_autora);
  const esEmpresaResenada = Boolean(resena.empresa_resenada);

  const autorNombre = modo === "recibida"
    ? ((resena.empresa_autora as any)?.nombre_comercial || (resena.empresa_autora as any)?.razon_social || (resena.proveedor_autor as any)?.nombre_comercial || (resena.proveedor_autor as any)?.nombre || "Anónimo")
    : null;

  const destinatarioNombre = modo === "enviada"
    ? ((resena.empresa_resenada as any)?.nombre_comercial || (resena.empresa_resenada as any)?.razon_social || (resena.proveedor_resenado as any)?.nombre_comercial || (resena.proveedor_resenado as any)?.nombre || "Anónimo")
    : null;

  const autorId = modo === "recibida"
    ? ((resena.empresa_autora as any)?.id || (resena.proveedor_autor as any)?.id)
    : null;

  const destinatarioId = modo === "enviada"
    ? ((resena.empresa_resenada as any)?.id || (resena.proveedor_resenado as any)?.id)
    : null;

  const perfilHref = modo === "recibida" && autorId
    ? `/empresas/${autorId}`
    : modo === "enviada" && destinatarioId
    ? `/empresas/${destinatarioId}`
    : null;

  const nombreMostrado = modo === "recibida" ? autorNombre : destinatarioNombre;
  const tipoIcono = modo === "recibida"
    ? (esEmpresaAutora ? <Building2 className="w-5 h-5 text-slate-500" /> : <User className="w-5 h-5 text-slate-500" />)
    : (esEmpresaResenada ? <Building2 className="w-5 h-5 text-slate-500" /> : <User className="w-5 h-5 text-slate-500" />);

  return (
    <Card className="p-6 border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
          {tipoIcono}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                {modo === "recibida" ? "Reseña de" : "Reseña sobre"}
              </p>
              <h3 className="font-bold text-slate-900 text-base">{nombreMostrado}</h3>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-none px-3 py-1 font-semibold text-[10px] uppercase tracking-wider shrink-0">
              Publicada
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Estrellas n={resena.calificacion} />
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(resena.creada_en).toLocaleDateString("es-AR")}
            </span>
          </div>
        </div>
      </div>

      {resena.comentario && (
        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-slate-700 leading-relaxed italic">"{resena.comentario}"</p>
        </div>
      )}

      {perfilHref && (
        <div className="flex justify-end">
          <Link
            href={perfilHref}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Ver perfil <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </Card>
  );
}
