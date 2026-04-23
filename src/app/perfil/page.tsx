"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertCircle,
  Building,
  Wrench,
  ArrowRight,
  User,
  Loader2,
  Star,
  MessageSquare,
  Inbox,
  Phone,
  Globe,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/cliente";
import { cn } from "@/lib/utilidades";

interface Resena {
  id: string;
  calificacion: number;
  comentario: string | null;
  creada_en: string;
  empresa_autora?: { razon_social: string; nombre_comercial: string | null } | null;
  proveedor_autor?: { nombre: string; nombre_comercial: string | null } | null;
}

function Estrellas({ n, size = "sm" }: { n: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(cls, i <= n ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
      ))}
    </div>
  );
}

export default function MiPerfilPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [profileDetails, setProfileDetails] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading) return;

    async function loadData() {
      if (!currentUser?.entityId) {
        setIsLoading(false);
        return;
      }

      const table = currentUser.role === "company" ? "empresas" : "proveedores";
      const { data } = await supabase.from(table).select("*").eq("id", currentUser.entityId).single();
      if (data) setProfileDetails(data);

      if (currentUser.role === "company") {
        const { data: rels } = await supabase
          .from("empresas_categorias")
          .select("categoria_id, categorias(nombre)")
          .eq("empresa_id", currentUser.entityId);
        if (rels) setServices(rels.map((r: any) => r.categorias?.nombre).filter(Boolean));
      } else if (currentUser.role === "provider") {
        const { data: rels } = await supabase
          .from("proveedores_categorias")
          .select("categoria_id, categorias(nombre)")
          .eq("proveedor_id", currentUser.entityId);
        if (rels) setServices(rels.map((r: any) => r.categorias?.nombre).filter(Boolean));
      }

      // Reseñas recibidas aprobadas
      const resenadaCol = currentUser.role === "company" ? "empresa_resenada_id" : "proveedor_resenado_id";
      const { data: resenasData } = await supabase
        .from("resenas")
        .select(
          `id, calificacion, comentario, creada_en,
           empresa_autora:empresa_autora_id(razon_social, nombre_comercial),
           proveedor_autor:proveedor_autor_id(nombre, nombre_comercial)`
        )
        .eq(resenadaCol, currentUser.entityId)
        .eq("estado", "aprobada")
        .order("creada_en", { ascending: false })
        .limit(3);
      if (resenasData) setResenas(resenasData as unknown as Resena[]);

      setIsLoading(false);
    }
    loadData();
  }, [authLoading, currentUser?.entityId, currentUser?.role]);

  if (!currentUser) return null;

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!profileDetails) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 text-lg mb-2">Comienza a configurar tu perfil corporativo</h3>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
          Aún no logramos enlazar tu usuario con los datos de tu empresa en el directorio. Para aparecer en las búsquedas, por favor inicia completando el formulario de tu Sede Principal.
        </p>
        <Link href="/perfil/datos" className="inline-flex items-center justify-center h-11 px-8 font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
          <Wrench className="w-4 h-4 mr-2" />
          Completar mis Datos
        </Link>
      </div>
    );
  }

  const estadoConfig: Record<string, { label: string; className: string }> = {
    aprobada:          { label: "Aprobado", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
    aprobado:          { label: "Aprobado", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
    verificado:        { label: "Verificado", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
    activo:            { label: "Activo", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
    pendiente_revision: { label: "En revisión", className: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
    rechazado:         { label: "Rechazado", className: "bg-rose-100 text-rose-700 hover:bg-rose-200" },
    rechazada:         { label: "Rechazado", className: "bg-rose-100 text-rose-700 hover:bg-rose-200" },
    borrador:          { label: "Borrador", className: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
    pausado:           { label: "Pausado", className: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
    oculto:            { label: "Oculto", className: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
  };

  const estadoActual = profileDetails.estado || "borrador";
  const estadoUI = estadoConfig[estadoActual] ?? { label: estadoActual, className: "bg-slate-100 text-slate-700 hover:bg-slate-200" };
  const esRechazado = estadoActual === "rechazado" || estadoActual === "rechazada";

  const promedioCalificacion = resenas.length
    ? resenas.reduce((acc, r) => acc + r.calificacion, 0) / resenas.length
    : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Bienvenido, {profileDetails.razon_social || profileDetails.nombre_comercial || currentUser.name}
          </h1>
          <p className="text-slate-500 mt-1">Revisión general del estado de tu perfil y suscripción.</p>
        </div>
        <Badge variant="secondary" data-tour="perfil-estado" className={estadoUI.className}>
          Estado: {estadoUI.label}
        </Badge>
      </div>

      {esRechazado && profileDetails.motivo_rechazo && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-900">Tu perfil fue rechazado</p>
            <p className="text-sm text-rose-700 mt-1">{profileDetails.motivo_rechazo}</p>
          </div>
        </div>
      )}

      {/* Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Datos y Contacto */}
        <Card data-tour="perfil-datos" className="p-6 border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-[0.08] transition-opacity">
            {currentUser.role === "company" ? <Building className="w-24 h-24" /> : <Wrench className="w-24 h-24" />}
          </div>
          <div className="flex items-center gap-3 mb-5 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Datos y Contacto</h2>
          </div>

          <div className="space-y-3 mb-5 relative z-10">
            {/* Email */}
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 text-slate-400 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Email</p>
                <p className="text-sm font-medium text-slate-800 truncate">{profileDetails.email || <span className="text-slate-400 italic font-normal">Sin especificar</span>}</p>
              </div>
            </div>

            {/* Teléfono / WhatsApp */}
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Teléfono de contacto</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800">
                    {profileDetails.whatsapp || profileDetails.telefono || <span className="text-slate-400 italic font-normal">Sin especificar</span>}
                  </p>
                  {(profileDetails.whatsapp || profileDetails.telefono) && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded border border-emerald-100">
                      <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-emerald-600" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WA
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sitio web */}
            {profileDetails.sitio_web && (
              <div className="flex items-start gap-2.5">
                <Globe className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Sitio web</p>
                  <a
                    href={profileDetails.sitio_web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary-600 hover:underline truncate block"
                  >
                    {profileDetails.sitio_web.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              </div>
            )}

            {/* Ubicación */}
            {(profileDetails.localidad || profileDetails.provincia) && (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Ubicación</p>
                  <p className="text-sm font-medium text-slate-800">
                    {[profileDetails.localidad, profileDetails.provincia].filter(Boolean).join(", ")}
                    {profileDetails.direccion ? ` · ${profileDetails.direccion}` : ""}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Link href="/perfil/datos" className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 transition relative z-10">
            Editar información <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Card>

        {/* Mis Rubros y Especialidades */}
        <Card data-tour="perfil-servicios" className="p-6 border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {currentUser.role === "company" ? "Rubros y Servicios" : "Especialidades"}
              </h2>
            </div>
            <Badge variant="outline" className="bg-slate-50 text-xs">
              {services.length} {services.length === 1 ? "rubro" : "rubros"}
            </Badge>
          </div>

          <div className="flex-1 mb-5">
            {services.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {services.slice(0, 6).map((s: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-md border border-slate-200 font-medium">
                    {s}
                  </span>
                ))}
                {services.length > 6 && (
                  <span className="px-2.5 py-1 bg-slate-50 text-slate-400 text-xs rounded-md border border-slate-100">
                    +{services.length - 6} más
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">Todavía no cargaste rubros.</p>
                <p className="text-xs text-slate-400 mt-0.5">Agregá categorías para aparecer en el directorio.</p>
              </div>
            )}

            {/* Descripción debajo de los rubros, solo si existe */}
            {profileDetails.descripcion && (
              <p className="text-xs text-slate-500 mt-4 line-clamp-3 italic border-t border-slate-100 pt-3">
                "{profileDetails.descripcion}"
              </p>
            )}
          </div>

          <Link href="/perfil/servicios" className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 transition mt-auto">
            Gestionar rubros <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Card>
      </div>

      {/* Resumen de Reseñas */}
      <Card data-tour="perfil-resenas" className="p-6 border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Reseñas recibidas</h2>
              {promedioCalificacion !== null && (
                <div className="flex items-center gap-2 mt-0.5">
                  <Estrellas n={Math.round(promedioCalificacion)} size="sm" />
                  <span className="text-xs text-slate-500">
                    {promedioCalificacion.toFixed(1)} · {resenas.length} reseña{resenas.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
          <Link
            href="/perfil/solicitudes"
            onClick={() => {
              // pasa el tab de reseñas recibidas via hash para que la página lo tome
              sessionStorage.setItem("bandeja_seccion", "resenas_recibidas");
            }}
            className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition"
          >
            Ver todas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {resenas.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Todavía no recibiste reseñas publicadas.</p>
            <p className="text-xs text-slate-400 mt-1">Aparecerán acá cuando alguien te evalúe en el directorio.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {resenas.map((r) => {
              const autorNombre =
                (r.empresa_autora as any)?.nombre_comercial ||
                (r.empresa_autora as any)?.razon_social ||
                (r.proveedor_autor as any)?.nombre_comercial ||
                (r.proveedor_autor as any)?.nombre ||
                "Anónimo";

              return (
                <div key={r.id} className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-amber-700">{autorNombre.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900">{autorNombre}</p>
                      <Estrellas n={r.calificacion} size="sm" />
                    </div>
                    {r.comentario && (
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2 italic">"{r.comentario}"</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(r.creada_en).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              );
            })}

            {resenas.length >= 3 && (
              <Link
                href="/perfil/solicitudes"
                className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-slate-500 hover:text-primary-600 border border-dashed border-slate-200 rounded-xl transition-colors hover:border-primary-200"
              >
                <Inbox className="w-4 h-4" />
                Ver todas en la Bandeja de Entrada
              </Link>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
