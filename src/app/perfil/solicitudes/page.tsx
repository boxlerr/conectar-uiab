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
} from "lucide-react";
import { useEffect, useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/cliente";
import { toast } from "sonner";
import {
  marcarSolicitudVista,
  marcarSolicitudRespondida,
  cerrarSolicitud,
} from "./acciones";

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
  empresa_origen?: {
    razon_social: string;
    nombre_fantasia: string | null;
    localidad: string | null;
  } | null;
  proveedor_origen?: {
    nombre: string;
    nombre_comercial: string | null;
    tipo_proveedor: string;
    localidad: string | null;
  } | null;
  oportunidad?: {
    id: string;
    titulo: string;
  } | null;
}

const ESTADO_CFG: Record<
  string,
  { label: string; className: string }
> = {
  enviada: { label: "Nueva", className: "bg-amber-50 text-amber-700" },
  vista: { label: "Vista", className: "bg-blue-50 text-blue-700" },
  respondida: { label: "Respondida", className: "bg-emerald-50 text-emerald-700" },
  cerrada: { label: "Cerrada", className: "bg-slate-100 text-slate-500" },
  cancelada: { label: "Cancelada", className: "bg-rose-50 text-rose-700" },
};

type FiltroEstado = "todas" | "activas" | "enviada" | "vista" | "respondida" | "cerrada";

export default function BandejaSolicitudesPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filtro, setFiltro] = useState<FiltroEstado>("activas");
  const [tick, setTick] = useState(0); // fuerza refetch

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser?.entityId) {
      setFetching(false);
      return;
    }

    let cancel = false;

    async function load() {
      const destinoCol =
        currentUser!.role === "company" ? "empresa_destino_id" : "proveedor_destino_id";

      const { data, error } = await supabase
        .from("solicitudes_presupuesto")
        .select(
          `id, oportunidad_id, mensaje, estado, enviada_en, vista_en, respondida_en, cerrada_en,
           cantidad, unidad, empresa_origen_id, proveedor_origen_id,
           empresa_origen:empresas!solicitudes_presupuesto_empresa_origen_id_fkey(razon_social, nombre_fantasia, localidad),
           proveedor_origen:proveedores!solicitudes_presupuesto_proveedor_origen_id_fkey(nombre, nombre_comercial, tipo_proveedor, localidad),
           oportunidad:oportunidades(id, titulo)`
        )
        .eq(destinoCol, currentUser!.entityId)
        .order("enviada_en", { ascending: false });

      if (cancel) return;

      if (error) {
        console.error("[BandejaSolicitudes]", error);
        toast.error("No pudimos cargar las solicitudes", { description: error.message });
      } else {
        setSolicitudes((data ?? []) as unknown as Solicitud[]);
      }
      setFetching(false);
    }

    load();
    return () => {
      cancel = true;
    };
  }, [authLoading, currentUser?.entityId, currentUser?.role, supabase, tick]);

  const filtradas = useMemo(() => {
    if (filtro === "todas") return solicitudes;
    if (filtro === "activas")
      return solicitudes.filter((s) => s.estado === "enviada" || s.estado === "vista");
    return solicitudes.filter((s) => s.estado === filtro);
  }, [solicitudes, filtro]);

  const counts = useMemo(() => {
    return {
      activas: solicitudes.filter((s) => s.estado === "enviada" || s.estado === "vista").length,
      enviada: solicitudes.filter((s) => s.estado === "enviada").length,
      vista: solicitudes.filter((s) => s.estado === "vista").length,
      respondida: solicitudes.filter((s) => s.estado === "respondida").length,
      cerrada: solicitudes.filter((s) => s.estado === "cerrada").length,
      todas: solicitudes.length,
    };
  }, [solicitudes]);

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
      if (res.success) {
        setTick((x) => x + 1);
      } else {
        toast.error("No se pudo actualizar", { description: res.error });
      }
    });
  };

  const handleResponder = (id: string) => {
    startTransition(async () => {
      const res = await marcarSolicitudRespondida(id);
      if (res.success) {
        toast.success("Marcada como respondida");
        setTick((x) => x + 1);
      } else {
        toast.error("No se pudo actualizar", { description: res.error });
      }
    });
  };

  const handleCerrar = (id: string) => {
    startTransition(async () => {
      const res = await cerrarSolicitud(id);
      if (res.success) {
        toast.success("Solicitud cerrada");
        setTick((x) => x + 1);
      } else {
        toast.error("No se pudo cerrar", { description: res.error });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bandeja de Solicitudes</h1>
          <p className="text-slate-500 mt-1">
            Postulaciones que recibiste en tus oportunidades publicadas.
          </p>
        </div>
        <Badge className="bg-primary-50 text-primary-700 border-none px-4 py-2">
          {counts.activas} activa{counts.activas === 1 ? "" : "s"}
        </Badge>
      </div>

      {/* Filtros */}
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
            {filtro === "activas"
              ? "No tenés solicitudes activas."
              : "No hay solicitudes en este filtro."}
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
    </div>
  );
}

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
    ? s.empresa_origen?.nombre_fantasia || s.empresa_origen?.razon_social
    : s.proveedor_origen?.nombre_comercial || s.proveedor_origen?.nombre;

  const origenLocalidad = esEmpresaOrigen
    ? s.empresa_origen?.localidad
    : s.proveedor_origen?.localidad;

  const origenTipo = esEmpresaOrigen ? "Empresa" : s.proveedor_origen?.tipo_proveedor ?? "Particular";

  const fechaEnvio = new Date(s.enviada_en);

  return (
    <Card className="p-6 border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            {esEmpresaOrigen ? (
              <Building2 className="w-5 h-5 text-slate-500" />
            ) : (
              <User className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 text-base truncate">
              {origenNombre ?? "Sin nombre"}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
              <span className="font-semibold uppercase tracking-wider">{origenTipo}</span>
              {origenLocalidad && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {origenLocalidad}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {fechaEnvio.toLocaleDateString("es-AR")}
              </span>
            </div>
          </div>
        </div>
        <Badge className={`${cfg.className} border-none px-3 py-1 font-semibold text-[10px] uppercase tracking-wider`}>
          {cfg.label}
        </Badge>
      </div>

      {/* Oportunidad asociada */}
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

      {/* Mensaje */}
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

      {/* Acciones */}
      <div className="flex flex-wrap gap-2 justify-end">
        {s.estado === "enviada" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVista(s.id)}
            disabled={isPending}
            className="text-xs"
          >
            <Eye className="w-3.5 h-3.5 mr-2" /> Marcar como vista
          </Button>
        )}
        {(s.estado === "enviada" || s.estado === "vista") && (
          <Button
            size="sm"
            onClick={() => onResponder(s.id)}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Marcar respondida
          </Button>
        )}
        {s.estado !== "cerrada" && s.estado !== "cancelada" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCerrar(s.id)}
            disabled={isPending}
            className="text-xs text-slate-500"
          >
            <Archive className="w-3.5 h-3.5 mr-2" /> Cerrar
          </Button>
        )}
      </div>
    </Card>
  );
}
