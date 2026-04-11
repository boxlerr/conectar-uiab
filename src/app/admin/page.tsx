"use client";

import { mockedCompanies, mockedProviders, mockedReviews } from "@/modulos/compartido/datos/datos-prueba";
import { Building, Wrench, MessageSquare, Users, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const pendingCompanies = mockedCompanies.filter((c) => c.status === "pending").length;
  const pendingProviders = mockedProviders.filter((p) => p.status === "pending").length;
  const pendingReviews = mockedReviews.filter((r) => r.status === "pending").length;

  const stats = [
    { name: "Total Empresas", value: mockedCompanies.length.toString(), icon: Building, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "Total Proveedores", value: mockedProviders.length.toString(), icon: Wrench, color: "text-emerald-600", bg: "bg-emerald-100" },
    { name: "Usuarios Activos", value: "24", icon: Users, color: "text-violet-600", bg: "bg-violet-100" },
    { name: "Reseñas Generadas", value: mockedReviews.length.toString(), icon: MessageSquare, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard General</h1>
          <p className="text-slate-500 mt-1">Resumen de la plataforma y métricas principales.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <Icon className="w-6 h-6 outline-none" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Acciones Pendientes
            </h2>
            <p className="text-sm text-slate-500 mt-1">Elementos que requieren tu atención.</p>
          </div>
          <div className="p-6 flex-1 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Empresas Nuevas</p>
                  <p className="text-sm text-slate-500">{pendingCompanies} pendientes de revisión</p>
                </div>
              </div>
              <Link href="/admin/empresas" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                Ver
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Proveedores Nuevos</p>
                  <p className="text-sm text-slate-500">{pendingProviders} pendientes de revisión</p>
                </div>
              </div>
              <Link href="/admin/proveedores" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                Ver
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Reseñas Reportadas / Pendientes</p>
                  <p className="text-sm text-slate-500">{pendingReviews} revisiones necesarias</p>
                </div>
              </div>
              <Link href="/admin/resenas" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                Ver
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              Actividad Reciente
            </h2>
            <p className="text-sm text-slate-500 mt-1">Últimos movimientos en la plataforma.</p>
          </div>
          <div className="p-6 flex-1">
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {/* Dummy Activity 1 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-100 text-emerald-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-slate-900 text-sm">Nuevo Proveedor</div>
                    <time className="text-xs font-medium text-slate-500">Hace 2 horas</time>
                  </div>
                  <div className="text-sm text-slate-600">Mecatrónica SRL se ha unido a ConectarUIAB.</div>
                </div>
              </div>

               {/* Dummy Activity 2 */}
               <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mt-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                  <Building className="w-4 h-4" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-slate-900 text-sm">Empresa Verificada</div>
                    <time className="text-xs font-medium text-slate-500">Ayer</time>
                  </div>
                  <div className="text-sm text-slate-600">Alimentos Brown completó su verificación.</div>
                </div>
              </div>

               {/* Dummy Activity 3 */}
               <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mt-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-amber-100 text-amber-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-slate-900 text-sm">Nueva Reseña</div>
                    <time className="text-xs font-medium text-slate-500">Hace 2 días</time>
                  </div>
                  <div className="text-sm text-slate-600">5 estrellas para Soluciones Industriales SA.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
