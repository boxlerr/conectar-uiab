import { createClient } from "@supabase/supabase-js";
import { Building, Wrench, MessageSquare, Users, TrendingUp, AlertCircle, ArrowRight, Briefcase } from "lucide-react";
import Link from "next/link";

async function getDashboardData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { count: totalEmpresas },
    { count: totalProveedores },
    { count: totalUsuarios },
    { count: oportunidadesAbiertas },
    { count: empresasPendientes },
    { count: proveedoresPendientes },
    { count: resenasPendientes },
    { data: ultimasOportunidades },
  ] = await Promise.all([
    supabase.from("empresas").select("*", { count: "exact", head: true }),
    supabase.from("proveedores").select("*", { count: "exact", head: true }),
    supabase.from("perfiles").select("*", { count: "exact", head: true }),
    supabase.from("oportunidades").select("*", { count: "exact", head: true }).eq("estado", "abierta"),
    supabase.from("empresas").select("*", { count: "exact", head: true }).eq("estado", "pendiente_revision"),
    supabase.from("proveedores").select("*", { count: "exact", head: true }).eq("estado", "pendiente_revision"),
    supabase.from("resenas").select("*", { count: "exact", head: true }).eq("estado", "pendiente_revision"),
    supabase.from("oportunidades")
      .select("id, titulo, estado, creado_en, empresa:empresas(razon_social)")
      .order("creado_en", { ascending: false })
      .limit(5),
  ]);

  return {
    totalEmpresas: totalEmpresas ?? 0,
    totalProveedores: totalProveedores ?? 0,
    totalUsuarios: totalUsuarios ?? 0,
    oportunidadesAbiertas: oportunidadesAbiertas ?? 0,
    empresasPendientes: empresasPendientes ?? 0,
    proveedoresPendientes: proveedoresPendientes ?? 0,
    resenasPendientes: resenasPendientes ?? 0,
    ultimasOportunidades: ultimasOportunidades ?? [],
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const stats = [
    { nombre: "Total Empresas", valor: data.totalEmpresas, icon: Building, color: "text-blue-600", bg: "bg-blue-50", href: "/admin/empresas" },
    { nombre: "Total Particulares", valor: data.totalProveedores, icon: Wrench, color: "text-emerald-600", bg: "bg-emerald-50", href: "/admin/proveedores" },
    { nombre: "Usuarios Registrados", valor: data.totalUsuarios, icon: Users, color: "text-violet-600", bg: "bg-violet-50", href: "/admin/usuarios" },
    { nombre: "Oportunidades Abiertas", valor: data.oportunidadesAbiertas, icon: Briefcase, color: "text-amber-600", bg: "bg-amber-50", href: "/admin/oportunidades" },
  ];

  const pendientes = [
    { label: "Empresas nuevas", count: data.empresasPendientes, icon: Building, color: "bg-blue-100 text-blue-600", href: "/admin/empresas" },
    { label: "Particulares nuevos", count: data.proveedoresPendientes, icon: Wrench, color: "bg-emerald-100 text-emerald-600", href: "/admin/proveedores" },
    { label: "Reseñas pendientes", count: data.resenasPendientes, icon: MessageSquare, color: "bg-amber-100 text-amber-600", href: "/admin/resenas" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1">Resumen en tiempo real de la plataforma UIAB Conecta.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.nombre} href={stat.href}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.nombre}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.valor}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Acciones Pendientes */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Acciones Pendientes
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Elementos que requieren revisión.</p>
          </div>
          <div className="p-4 space-y-3">
            {pendientes.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${p.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{p.label}</p>
                      <p className="text-xs text-slate-500">{p.count} pendiente{p.count !== 1 ? "s" : ""} de revisión</p>
                    </div>
                  </div>
                  <Link href={p.href}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 bg-primary-50 px-3 py-1.5 rounded-lg">
                    Revisar <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Últimas Oportunidades */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              Últimas Oportunidades
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Oportunidades publicadas recientemente.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {data.ultimasOportunidades.length === 0 ? (
              <p className="p-6 text-sm text-slate-500 text-center">No hay oportunidades registradas.</p>
            ) : (
              data.ultimasOportunidades.map((op: any) => (
                <div key={op.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{op.titulo}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {(op.empresa as any)?.razon_social ?? "Sin empresa"} · {new Date(op.creado_en).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                    op.estado === "abierta" ? "bg-emerald-100 text-emerald-700" :
                    op.estado === "cerrada" ? "bg-slate-100 text-slate-600" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {op.estado}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-slate-100">
            <Link href="/admin/oportunidades"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 justify-center">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
