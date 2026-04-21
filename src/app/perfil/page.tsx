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
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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
  const supabase = createClient();

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
  }, [authLoading, currentUser?.entityId, currentUser?.role, supabase]);

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
        <Badge variant="secondary" className={estadoUI.className}>
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
        <Card className="p-6 border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-[0.08] transition-opacity">
            {currentUser.role === "company" ? <Building className="w-24 h-24" /> : <Wrench className="w-24 h-24" />}
          </div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Datos y Contacto</h2>
          </div>
          <div className="space-y-4 mb-6 relative z-10">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Correo de Contacto</p>
              <p className="text-sm font-medium text-slate-800">{profileDetails.email || "No especificado"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Teléfono Publicado</p>
              <p className="text-sm font-medium text-slate-800">{profileDetails.telefono || "No especificado"}</p>
            </div>
          </div>
          <Link href="/perfil/datos" className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 transition relative z-10">
            Actualizar mi información <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Card>

        {/* Mis Servicios */}
        <Card className="p-6 border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Mis Servicios</h2>
            </div>
            <Badge variant="outline" className="bg-slate-50">{currentUser.role === "company" ? "Servicios" : "Especialidad"}</Badge>
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex flex-wrap gap-2">
              {services.length > 0
                ? services.slice(0, 3).map((s: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-md border border-slate-200">{s}</span>
                  ))
                : <span className="text-sm text-slate-400 italic">No hay servicios definidos aún</span>}
              {services.length > 3 && (
                <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-xs rounded-md">+{services.length - 3} más</span>
              )}
            </div>
            <p className="text-xs text-slate-500 line-clamp-2 mt-3">
              {profileDetails.descripcion || "Dirígete a Datos y Contacto para escribir un resumen sobre ti."}
            </p>
          </div>
          <Link href="/perfil/servicios" className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 transition">
            Gestionar mis especialidades <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Card>
      </div>

      {/* Resumen de Reseñas */}
      <Card className="p-6 border-slate-100 shadow-sm">
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
