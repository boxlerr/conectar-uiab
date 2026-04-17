"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, TrendingUp, CreditCard, Building, Wrench, Search, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { asignarTarifa } from "@/modulos/admin/acciones";
import { NivelTarifa } from "@/tipos";

type Empresa = {
  id: string;
  razon_social: string;
  email: string;
  estado: string;
  tarifa: number | null;
  creado_en: string;
};

type Proveedor = {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  estado: string;
  creado_en: string;
};

const TARIFA_PRECIO: Record<number, number> = {
  1: 108_000,
  2: 216_000,
  3: 360_000,
};

const TARIFA_LABEL: Record<number, string> = {
  1: "Tarifa 1",
  2: "Tarifa 2",
  3: "Tarifa 3",
};

const TARIFA_STYLE: Record<number, string> = {
  1: "bg-slate-100 text-slate-700",
  2: "bg-blue-100 text-blue-700",
  3: "bg-amber-100 text-amber-700",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount);

export function PanelSuscripciones({ empresas, proveedores }: { empresas: Empresa[]; proveedores: Proveedor[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filtroTipo, setFiltroTipo] = useState<"company" | "provider" | "all">("company");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionada, setSeleccionada] = useState<Empresa | null>(null);

  function refresh() { startTransition(() => router.refresh()); }

  async function handleAsignarTarifa(empresaId: string, tarifa: NivelTarifa) {
    await asignarTarifa(empresaId, tarifa);
    refresh();
    if (seleccionada?.id === empresaId) setSeleccionada(prev => prev ? { ...prev, tarifa } : null);
  }

  // Métricas reales
  const ingresosAnuales = empresas.reduce((acc, e) => acc + (e.tarifa ? TARIFA_PRECIO[e.tarifa] ?? 0 : 0), 0);
  const ingresosMensual = Math.round(ingresosAnuales / 12);
  const sinTarifa = empresas.filter((e) => !e.tarifa).length;
  const conTarifa = empresas.filter((e) => e.tarifa).length;

  const metricas = [
    {
      label: "Ingreso Mensual Estimado",
      valor: formatCurrency(ingresosMensual),
      sub: "Basado en tarifas asignadas",
      icon: TrendingUp,
      bg: "bg-primary-50",
      color: "text-primary-600",
    },
    {
      label: "Ingreso Anual Estimado",
      valor: formatCurrency(ingresosAnuales),
      sub: `${conTarifa} empresas con tarifa asignada`,
      icon: DollarSign,
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      label: "Empresas Activas",
      valor: empresas.length,
      sub: `${sinTarifa} sin tarifa asignada`,
      icon: Building,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
    {
      label: "Particulares Activos",
      valor: proveedores.length,
      sub: "Aprobados en la plataforma",
      icon: Wrench,
      bg: "bg-violet-50",
      color: "text-violet-600",
    },
  ];

  const empresasFiltradas = empresas.filter((e) =>
    !busqueda || e.razon_social.toLowerCase().includes(busqueda.toLowerCase()) || e.email.toLowerCase().includes(busqueda.toLowerCase())
  );
  const proveedoresFiltrados = proveedores.filter((p) =>
    !busqueda || `${p.nombre} ${p.apellido ?? ""}`.toLowerCase().includes(busqueda.toLowerCase()) || p.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-primary-600" />
            Finanzas y Suscripciones
          </h1>
          <p className="text-slate-500 mt-1">Gestioná las tarifas de empresas y supervisá los ingresos de la plataforma.</p>
        </div>
        <Button variant="outline" className="gap-2 bg-white hidden sm:flex" disabled>
          <Download className="w-4 h-4" />
          Exportar Reporte
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metricas.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${m.bg} ${m.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">{m.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{m.valor}</p>
                  <p className="text-xs text-slate-400 mt-1">{m.sub}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribución por tarifa */}
      <Card className="p-5 shadow-sm border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Distribución por Tarifa</p>
        <div className="grid grid-cols-3 gap-4">
          {([1, 2, 3] as const).map((nivel) => {
            const count = empresas.filter((e) => e.tarifa === nivel).length;
            const total = ingresosAnuales > 0 ? (count * TARIFA_PRECIO[nivel] / ingresosAnuales) * 100 : 0;
            return (
              <div key={nivel} className="text-center">
                <div className={`text-xs font-bold px-2 py-1 rounded-full inline-block mb-2 ${TARIFA_STYLE[nivel]}`}>
                  {TARIFA_LABEL[nivel]}
                </div>
                <p className="text-2xl font-bold text-slate-900">{count}</p>
                <p className="text-xs text-slate-500">{formatCurrency(TARIFA_PRECIO[nivel])}/año</p>
                <p className="text-xs text-slate-400">{total.toFixed(0)}% del ingreso</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Filtros + tabla */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-center shadow-sm border-slate-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
          {(["company", "provider"] as const).map((tipo) => (
            <button key={tipo} onClick={() => setFiltroTipo(tipo)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                filtroTipo === tipo ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              {tipo === "company" ? `Empresas (${empresas.length})` : `Particulares (${proveedores.length})`}
            </button>
          ))}
        </div>
      </Card>

      {filtroTipo === "company" ? (
        <Card className="shadow-sm border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarifa</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Importe Anual</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Miembro desde</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Cambiar Tarifa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {empresasFiltradas.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No se encontraron empresas.</td></tr>
                ) : empresasFiltradas.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Building className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{e.razon_social}</p>
                          <p className="text-xs text-slate-500">{e.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {e.tarifa ? (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TARIFA_STYLE[e.tarifa]}`}>
                          {TARIFA_LABEL[e.tarifa]}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {e.tarifa ? formatCurrency(TARIFA_PRECIO[e.tarifa]) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(e.creado_en).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {([1, 2, 3] as const).map((nivel) => (
                          <button key={nivel}
                            disabled={isPending || e.tarifa === nivel}
                            onClick={() => handleAsignarTarifa(e.id, nivel)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all border ${
                              e.tarifa === nivel
                                ? `${TARIFA_STYLE[nivel]} border-current cursor-default`
                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}>
                            T{nivel}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="shadow-sm border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Particular</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Registrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {proveedoresFiltrados.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500">No se encontraron particulares.</td></tr>
                ) : proveedoresFiltrados.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <Wrench className="w-4 h-4 text-emerald-600" />
                        </div>
                        <p className="font-semibold text-slate-900 text-sm">{p.nombre} {p.apellido ?? ""}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{p.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(p.creado_en).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
