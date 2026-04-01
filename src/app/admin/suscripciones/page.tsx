"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, CreditCard, Building, Wrench, Receipt, ArrowUpRight, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockedCompanies, mockedProviders } from "@/modulos/compartido/data/mockDB";

// Simulated Subscription Data
// Note: In a real app, this would be computed from a database of actual active subscriptions
const SUBSCRIPTION_PRICE = 5000; // Example price per month in ARS

const createMockSubscriptions = () => {
  const allEntities = [
    ...mockedCompanies.filter(c => c.status === "approved").map(c => ({ ...c, type: 'empresa' })),
    ...mockedProviders.filter(p => p.status === "approved").map(p => ({ ...p, type: 'proveedor' }))
  ];

  return allEntities.map((entity, index) => ({
    id: `sub_${index + 1}`,
    entityId: entity.id,
    entityName: entity.name,
    entityType: entity.type,
    plan: "Pro Anual",
    status: index % 5 === 0 ? "past_due" : "active", // Simulate some past due
    amount: SUBSCRIPTION_PRICE,
    currency: "ARS",
    nextBilling: "2026-04-01",
    lastPayment: "2026-03-01",
  }));
};

const subscriptions = createMockSubscriptions();
const activeSubs = subscriptions.filter(s => s.status === "active");

const metrics = {
  totalActive: activeSubs.length,
  mrr: activeSubs.length * SUBSCRIPTION_PRICE, // Monthly Recurring Revenue
  get uiabShare() { return this.mrr * 0.90; }, // 90%
  get vaxlerFee() { return this.mrr * 0.10; }, // 10%
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
};

export default function AdminSuscripcionesPage() {
  const [filter, setFilter] = useState<"all" | "empresa" | "proveedor">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSubscriptions = subscriptions.filter(s => {
    const matchesFilter = filter === "all" || s.entityType === filter;
    const matchesSearch = s.entityName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-primary-600" />
            Finanzas y Suscripciones
          </h1>
          <p className="text-slate-500 mt-1">Supervisa los ingresos recurrentes (MRR) y el estado de las cuentas.</p>
        </div>
        <Button variant="outline" className="gap-2 bg-white hidden sm:flex">
          <Download className="w-4 h-4" />
          Exportar Reporte
        </Button>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* MRR */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-24 h-24 text-primary-600" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Ingreso Mensual (MRR)</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(metrics.mrr)}</p>
            <div className="flex items-center gap-2 mt-4 text-sm font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md">
              <ArrowUpRight className="w-4 h-4" />
              <span>+12.5% este mes</span>
            </div>
          </div>
        </div>

        {/* UIAB Share */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building className="w-6 h-6" />
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">90%</Badge>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Ingreso UIAB (Neto)</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(metrics.uiabShare)}</p>
            <p className="text-xs text-slate-500 mt-4">Disponible para liquidación mensual.</p>
          </div>
        </div>

        {/* Vaxler Fee */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
               <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center backdrop-blur-sm border border-white/10">
                <Receipt className="w-6 h-6" />
              </div>
              <Badge variant="outline" className="text-indigo-200 border-indigo-500/30 bg-indigo-500/10">10% Fee</Badge>
            </div>
            <p className="text-sm font-medium text-slate-400 mb-1">Comisión Plataforma (vaxler)</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(metrics.vaxlerFee)}</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-indigo-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Facturación automática activada
            </div>
          </div>
        </div>

         {/* Active Subs */}
         <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Suscripciones Activas</p>
            <p className="text-3xl font-bold text-slate-900">{metrics.totalActive}</p>
            <div className="flex items-center justify-between mt-4 border-t border-slate-100 pt-3">
              <div className="text-xs text-slate-500"><span className="font-semibold text-slate-700">{subscriptions.length - metrics.totalActive}</span> en mora</div>
              <div className="text-xs text-slate-500"><span className="font-semibold text-slate-700">{metrics.totalActive}</span> al día</div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <h2 className="text-xl font-bold text-slate-900 mt-12 mb-4">Historial de Suscripciones</h2>
      
      <Card className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm border-slate-100 mb-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre de empresa o proveedor..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button 
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Todas
          </button>
          <button 
            onClick={() => setFilter("empresa")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "empresa" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Empresas
          </button>
          <button 
            onClick={() => setFilter("proveedor")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "proveedor" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Proveedores
          </button>
        </div>
      </Card>

      <Card className="shadow-sm border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Entidad</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Importe</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Próximo Cobro</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron suscripciones con estos filtros.
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          sub.entityType === 'empresa' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {sub.entityType === 'empresa' ? <Building className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{sub.entityName}</div>
                          <div className="text-xs text-slate-500 capitalize">{sub.entityType}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-700">{sub.plan}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sub.status === "active" ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Al día</Badge>
                      ) : (
                        <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">Mora</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-900">{formatCurrency(sub.amount)}</span>
                      <span className="text-xs text-slate-400 ml-1">/{sub.currency}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{sub.nextBilling}</div>
                      <div className="text-xs text-slate-500">Último: {sub.lastPayment}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                       <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700 hover:bg-primary-50">
                          Ver Detalle
                       </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
