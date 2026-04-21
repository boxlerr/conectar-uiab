import { createClient } from "@supabase/supabase-js";
import {
  Building,
  Wrench,
  MessageSquare,
  Users,
  AlertCircle,
  ArrowRight,
  Briefcase,
  DollarSign,
  Sparkles,
  Activity,
  Star,
  UserPlus,
  FileText,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { ActividadReciente } from "./ActividadReciente";

type ActividadItem = {
  id: string;
  tipo: "empresa" | "proveedor" | "oportunidad" | "resena" | "pago" | "usuario";
  titulo: string;
  detalle?: string;
  estado?: string | null;
  fecha: string;
  href: string;
  esNuevo: boolean; // <24h
};

const MS_DIA = 24 * 60 * 60 * 1000;
const MS_SEMANA = 7 * MS_DIA;

function esRecienteMs(fecha: string | null | undefined, ms: number): boolean {
  if (!fecha) return false;
  return Date.now() - new Date(fecha).getTime() < ms;
}

async function getDashboardData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const hace24h = new Date(Date.now() - MS_DIA).toISOString();
  const hace7d = new Date(Date.now() - MS_SEMANA).toISOString();

  const [
    { count: totalEmpresas },
    { count: totalProveedores },
    { count: totalUsuarios },
    { count: oportunidadesAbiertas },
    { count: empresasPendientes },
    { count: proveedoresPendientes },
    { count: resenasPendientes },
    { count: empresasNuevas24h },
    { count: proveedoresNuevos24h },
    { count: usuariosNuevos7d },
    { count: oportunidadesNuevas7d },
    { data: ultimasOportunidades },
    { data: ultimasEmpresas },
    { data: ultimosProveedores },
    { data: ultimasResenas },
    { data: ultimosPagos },
    { data: empresasTarifa },
    { data: tarifasPrecios },
  ] = await Promise.all([
    supabase.from("empresas").select("*", { count: "exact", head: true }),
    supabase.from("proveedores").select("*", { count: "exact", head: true }),
    supabase.from("perfiles").select("*", { count: "exact", head: true }),
    supabase.from("oportunidades").select("*", { count: "exact", head: true }).eq("estado", "abierta"),
    supabase.from("empresas").select("*", { count: "exact", head: true }).eq("estado", "pendiente_revision"),
    supabase.from("proveedores").select("*", { count: "exact", head: true }).eq("estado", "pendiente_revision"),
    supabase.from("resenas").select("*", { count: "exact", head: true }).eq("estado", "pendiente_revision"),
    supabase.from("empresas").select("*", { count: "exact", head: true }).gte("creado_en", hace24h),
    supabase.from("proveedores").select("*", { count: "exact", head: true }).gte("creado_en", hace24h),
    supabase.from("perfiles").select("*", { count: "exact", head: true }).gte("creado_en", hace7d),
    supabase.from("oportunidades").select("*", { count: "exact", head: true }).gte("creado_en", hace7d),
    supabase
      .from("oportunidades")
      .select("id, titulo, estado, creado_en, empresa:empresas(razon_social)")
      .order("creado_en", { ascending: false })
      .limit(6),
    supabase
      .from("empresas")
      .select("id, razon_social, estado, creado_en")
      .order("creado_en", { ascending: false })
      .limit(6),
    supabase
      .from("proveedores")
      .select("id, nombre, apellido, estado, creado_en")
      .order("creado_en", { ascending: false })
      .limit(6),
    supabase
      .from("resenas")
      .select("id, estado, creado_en, puntuacion, comentario")
      .order("creado_en", { ascending: false })
      .limit(6),
    supabase
      .from("pagos_suscripciones")
      .select("id, monto, moneda, estado, pagado_en, creado_en")
      .order("creado_en", { ascending: false })
      .limit(6),
    supabase.from("empresas").select("tarifa").eq("estado", "aprobada"),
    supabase.from("tarifas_precios").select("nivel, precio_mensual"),
  ]);

  // Calcular ingreso mensual estimado
  const precios: Record<number, number> = {};
  (tarifasPrecios ?? []).forEach((t: any) => {
    precios[t.nivel] = Number(t.precio_mensual) || 0;
  });
  const ingresoMensual = (empresasTarifa ?? []).reduce(
    (acc: number, e: any) => acc + (e.tarifa ? precios[e.tarifa] ?? 0 : 0),
    0
  );

  // Armar feed unificado
  const actividad: ActividadItem[] = [];

  (ultimasEmpresas ?? []).forEach((e: any) => {
    actividad.push({
      id: `emp-${e.id}`,
      tipo: "empresa",
      titulo: e.razon_social,
      detalle: `Empresa ${e.estado === "pendiente_revision" ? "pendiente" : e.estado}`,
      estado: e.estado,
      fecha: e.creado_en,
      href: "/admin/empresas",
      esNuevo: esRecienteMs(e.creado_en, MS_DIA),
    });
  });

  (ultimosProveedores ?? []).forEach((p: any) => {
    actividad.push({
      id: `prov-${p.id}`,
      tipo: "proveedor",
      titulo: `${p.nombre} ${p.apellido ?? ""}`.trim(),
      detalle: `Particular ${p.estado === "pendiente_revision" ? "pendiente" : p.estado}`,
      estado: p.estado,
      fecha: p.creado_en,
      href: "/admin/proveedores",
      esNuevo: esRecienteMs(p.creado_en, MS_DIA),
    });
  });

  (ultimasOportunidades ?? []).forEach((op: any) => {
    actividad.push({
      id: `op-${op.id}`,
      tipo: "oportunidad",
      titulo: op.titulo,
      detalle: (op.empresa as any)?.razon_social ?? "Sin empresa",
      estado: op.estado,
      fecha: op.creado_en,
      href: "/admin/oportunidades",
      esNuevo: esRecienteMs(op.creado_en, MS_DIA),
    });
  });

  (ultimasResenas ?? []).forEach((r: any) => {
    actividad.push({
      id: `res-${r.id}`,
      tipo: "resena",
      titulo: `Reseña · ${r.puntuacion ?? "?"}★`,
      detalle:
        (r.comentario ?? "").length > 60
          ? (r.comentario ?? "").slice(0, 60) + "…"
          : r.comentario ?? "Sin comentario",
      estado: r.estado,
      fecha: r.creado_en,
      href: "/admin/resenas",
      esNuevo: esRecienteMs(r.creado_en, MS_DIA),
    });
  });

  (ultimosPagos ?? []).forEach((pg: any) => {
    actividad.push({
      id: `pago-${pg.id}`,
      tipo: "pago",
      titulo: `Pago · ${new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(Number(pg.monto) || 0)}`,
      detalle: pg.estado ?? "pendiente",
      estado: pg.estado,
      fecha: pg.pagado_en ?? pg.creado_en,
      href: "/admin/suscripciones",
      esNuevo: esRecienteMs(pg.pagado_en ?? pg.creado_en, MS_DIA),
    });
  });

  actividad.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return {
    totalEmpresas: totalEmpresas ?? 0,
    totalProveedores: totalProveedores ?? 0,
    totalUsuarios: totalUsuarios ?? 0,
    oportunidadesAbiertas: oportunidadesAbiertas ?? 0,
    empresasPendientes: empresasPendientes ?? 0,
    proveedoresPendientes: proveedoresPendientes ?? 0,
    resenasPendientes: resenasPendientes ?? 0,
    empresasNuevas24h: empresasNuevas24h ?? 0,
    proveedoresNuevos24h: proveedoresNuevos24h ?? 0,
    usuariosNuevos7d: usuariosNuevos7d ?? 0,
    oportunidadesNuevas7d: oportunidadesNuevas7d ?? 0,
    ingresoMensual,
    actividad: actividad.slice(0, 30),
  };
}

const formatARS = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);



export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const totalPendientes =
    data.empresasPendientes + data.proveedoresPendientes + data.resenasPendientes;

  const stats = [
    {
      nombre: "Socios",
      valor: data.totalEmpresas,
      delta: data.empresasNuevas24h,
      deltaLabel: "nuevas 24h",
      icon: Building,
      accent: "bg-blue-50 text-blue-700",
      href: "/admin/empresas",
    },
    {
      nombre: "Particulares",
      valor: data.totalProveedores,
      delta: data.proveedoresNuevos24h,
      deltaLabel: "nuevos 24h",
      icon: Wrench,
      accent: "bg-emerald-50 text-emerald-700",
      href: "/admin/proveedores",
    },
    {
      nombre: "Usuarios",
      valor: data.totalUsuarios,
      delta: data.usuariosNuevos7d,
      deltaLabel: "nuevos 7d",
      icon: Users,
      accent: "bg-violet-50 text-violet-700",
      href: "/admin/usuarios",
    },
    {
      nombre: "Oportunidades abiertas",
      valor: data.oportunidadesAbiertas,
      delta: data.oportunidadesNuevas7d,
      deltaLabel: "nuevas 7d",
      icon: Briefcase,
      accent: "bg-amber-50 text-amber-700",
      href: "/admin/oportunidades",
    },
  ];

  const pendientes = [
    {
      label: "Empresas por revisar",
      count: data.empresasPendientes,
      icon: Building,
      accent: "bg-blue-50 text-blue-700",
      href: "/admin/empresas",
    },
    {
      label: "Particulares por revisar",
      count: data.proveedoresPendientes,
      icon: Wrench,
      accent: "bg-emerald-50 text-emerald-700",
      href: "/admin/proveedores",
    },
    {
      label: "Reseñas por moderar",
      count: data.resenasPendientes,
      icon: MessageSquare,
      accent: "bg-amber-50 text-amber-700",
      href: "/admin/resenas",
    },
  ];

  const accesosRapidos = [
    { label: "Suscripciones", href: "/admin/suscripciones", icon: DollarSign },
    { label: "Empresas", href: "/admin/empresas", icon: Building },
    { label: "Particulares", href: "/admin/proveedores", icon: Wrench },
    { label: "Oportunidades", href: "/admin/oportunidades", icon: Briefcase },
    { label: "Reseñas", href: "/admin/resenas", icon: Star },
    { label: "Usuarios", href: "/admin/usuarios", icon: Users },
    { label: "Servicios", href: "/admin/servicios", icon: FileText },
    { label: "Configuración", href: "/admin/configuracion", icon: Activity },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header editorial */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
            Administración · Resumen
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-2 max-w-xl text-sm">
            Todo lo que está pasando en UIAB Conecta en un solo lugar. Las novedades de las últimas
            24 horas aparecen marcadas.
          </p>
        </div>
      </div>

      {/* Alerta si hay pendientes */}
      {totalPendientes > 0 ? (
        <Link
          href="#pendientes"
          className="flex items-center gap-4 bg-amber-50 ring-1 ring-amber-200 rounded-lg p-4 hover:bg-amber-100 transition-colors"
        >
          <div className="w-10 h-10 rounded-md bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900">
              {totalPendientes} elemento{totalPendientes !== 1 ? "s" : ""} esperando tu revisión
            </p>
            <p className="text-xs text-amber-800/80">
              {data.empresasPendientes} empresa{data.empresasPendientes !== 1 ? "s" : ""} ·{" "}
              {data.proveedoresPendientes} particular{data.proveedoresPendientes !== 1 ? "es" : ""} ·{" "}
              {data.resenasPendientes} reseña{data.resenasPendientes !== 1 ? "s" : ""}
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-amber-800 shrink-0" />
        </Link>
      ) : null}

      {/* Stats principales con delta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.nombre}
              href={stat.href}
              className="bg-white rounded-lg p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 hover:ring-slate-200 transition-all group min-w-0"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-10 h-10 rounded-md flex items-center justify-center ${stat.accent}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {stat.delta > 0 ? (
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-50 text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />+{stat.delta}
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {stat.nombre}
              </p>
              <p
                className="font-bold text-slate-900 tabular-nums leading-none mt-1"
                style={{ fontSize: "clamp(1.75rem, 2.5vw, 2.25rem)" }}
              >
                {stat.valor.toLocaleString("es-AR")}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {stat.delta > 0 ? `${stat.delta} ${stat.deltaLabel}` : "Sin novedades recientes"}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Finanzas resumen */}
      <Link
        href="/admin/suscripciones"
        className="block bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-6 hover:from-slate-900 hover:to-slate-700 transition-all ring-1 ring-slate-800 group"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-md bg-primary-500/20 text-primary-300 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-300 mb-1">
                Ingreso mensual estimado
              </p>
              <p
                className="font-bold text-white tabular-nums leading-none break-words"
                style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
              >
                {formatARS(data.ingresoMensual)}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Proyección anual {formatARS(data.ingresoMensual * 12)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary-300 group-hover:text-white transition-colors">
            Gestionar tarifas y pagos
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pendientes */}
        <div id="pendientes" className="lg:col-span-1 bg-white rounded-lg shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-100">
          <div className="p-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              Acciones pendientes
            </h2>
            <p className="text-xs text-slate-500 mt-1">Elementos que requieren revisión.</p>
          </div>
          <div className="p-3 pt-0 space-y-2">
            {pendientes.every((p) => p.count === 0) ? (
              <div className="bg-emerald-50 text-emerald-700 text-sm rounded-md p-4 text-center">
                Todo al día. Nada pendiente.
              </div>
            ) : (
              pendientes.map((p) => {
                const Icon = p.icon;
                const highlight = p.count > 0;
                return (
                  <Link
                    key={p.label}
                    href={p.href}
                    className={`flex items-center justify-between gap-3 p-3 rounded-md transition-colors ${
                      highlight
                        ? "bg-slate-50 hover:bg-slate-100"
                        : "bg-white hover:bg-slate-50 opacity-70"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${p.accent}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{p.label}</p>
                        <p className="text-xs text-slate-500">
                          {p.count} pendiente{p.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-lg font-bold tabular-nums ${
                        highlight ? "text-rose-600" : "text-slate-400"
                      }`}
                    >
                      {p.count}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Actividad reciente */}
        <ActividadReciente items={data.actividad} />
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {accesosRapidos.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="bg-white rounded-md p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 hover:ring-slate-300 hover:bg-slate-50 transition-all flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-700 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-800">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
