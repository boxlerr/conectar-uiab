"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building, Check, X, Search, Eye, DollarSign, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgeTarifa } from "@/components/ui/badge-tarifa";
import { NivelTarifa } from "@/tipos";
import {
  aprobarEmpresa,
  rechazarEmpresa,
  asignarTarifa,
} from "@/modulos/admin/acciones";

const NIVELES_TARIFA: NivelTarifa[] = [1, 2, 3];

const TARIFAS: Record<NivelTarifa, { nombre: string }> = {
  1: { nombre: "Tarifa 1" },
  2: { nombre: "Tarifa 2" },
  3: { nombre: "Tarifa 3" },
};

function formatearPrecioTarifa(precioAnual: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(precioAnual);
}

type Empresa = {
  id: string;
  razon_social: string;
  nombre_comercial: string | null;
  cuit: string | null;
  email: string | null;
  telefono: string | null;
  localidad: string | null;
  provincia: string | null;
  descripcion: string | null;
  estado: string;
  motivo_rechazo: string | null;
  tarifa: NivelTarifa | null;
  creado_en: string;
  aprobada_en: string | null;
  estado_suscripcion?: string | null;
};

type Filtro = "all" | "pendiente_revision" | "aprobada" | "rechazada";

const ESTADO_BADGE: Record<string, { label: string; className: string }> = {
  aprobada:            { label: "Aprobada", className: "bg-emerald-100 text-emerald-700" },
  pendiente_revision:  { label: "Pendiente", className: "bg-amber-100 text-amber-700" },
  rechazada:           { label: "Rechazada", className: "bg-rose-100 text-rose-700" },
  borrador:            { label: "Borrador", className: "bg-slate-100 text-slate-600" },
  pausada:             { label: "Pausada", className: "bg-orange-100 text-orange-700" },
  oculta:              { label: "Oculta", className: "bg-slate-100 text-slate-500" },
};

export function PanelEmpresas({ empresas, preciosDb }: { empresas: Empresa[], preciosDb: Record<number, number> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filtro, setFiltro] = useState<Filtro>("pendiente_revision");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionada, setSeleccionada] = useState<Empresa | null>(null);
  const [modalRechazo, setModalRechazo] = useState<{ id: string; nombre: string } | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  const filtradas = empresas.filter((e) => {
    const matchFiltro = filtro === "all" || e.estado === filtro;
    const matchBusqueda = !busqueda || e.razon_social.toLowerCase().includes(busqueda.toLowerCase()) ||
      (e.email ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (e.cuit ?? "").includes(busqueda);
    return matchFiltro && matchBusqueda;
  });

  const counts = {
    all: empresas.length,
    pendiente_revision: empresas.filter((e) => e.estado === "pendiente_revision").length,
    aprobada: empresas.filter((e) => e.estado === "aprobada").length,
    rechazada: empresas.filter((e) => e.estado === "rechazada").length,
  };

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleAprobar(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    await aprobarEmpresa(id);
    refresh();
    if (seleccionada?.id === id) setSeleccionada(prev => prev ? { ...prev, estado: "aprobada" } : null);
  }

  async function handleRechazar() {
    if (!modalRechazo || !motivoRechazo.trim()) return;
    await rechazarEmpresa(modalRechazo.id, motivoRechazo);
    setModalRechazo(null);
    setMotivoRechazo("");
    refresh();
    if (seleccionada?.id === modalRechazo.id) setSeleccionada(null);
  }

  async function handleTarifa(id: string, tarifa: NivelTarifa) {
    await asignarTarifa(id, tarifa);
    refresh();
    if (seleccionada?.id === id) setSeleccionada(prev => prev ? { ...prev, tarifa } : null);
  }

  const TABS: { key: Filtro; label: string }[] = [
    { key: "pendiente_revision", label: `Pendientes (${counts.pendiente_revision})` },
    { key: "aprobada", label: `Aprobadas (${counts.aprobada})` },
    { key: "rechazada", label: `Rechazadas (${counts.rechazada})` },
    { key: "all", label: `Todas (${counts.all})` },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Building className="w-8 h-8 text-primary-600" />
          Gestión de Empresas
        </h1>
        <p className="text-slate-500 mt-1">Aprobá, rechazá y asigná tarifas a las empresas registradas.</p>
      </div>

      {/* Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-center shadow-sm border-slate-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, CUIT o email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 w-full sm:w-auto overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setFiltro(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                filtro === tab.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Lista */}
      <div className="space-y-3">
        {filtradas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <Building className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hay empresas con este filtro.</p>
          </div>
        ) : filtradas.map((empresa) => {
          const badge = ESTADO_BADGE[empresa.estado] ?? { label: empresa.estado, className: "bg-slate-100 text-slate-600" };
          return (
            <Card key={empresa.id}
              className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-sm border-slate-100 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group"
              onClick={() => setSeleccionada(empresa)}>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                {empresa.razon_social.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors truncate">
                    {empresa.razon_social}
                  </h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                    {badge.label}
                  </span>
                  {empresa.tarifa && <BadgeTarifa tarifa={empresa.tarifa} mostrarPrecio precioMensual={preciosDb[empresa.tarifa] ? preciosDb[empresa.tarifa] : null} />}
                </div>
                <p className="text-sm text-slate-500 truncate">
                  {empresa.cuit && <span className="mr-3">CUIT: {empresa.cuit}</span>}
                  {empresa.email && <span className="mr-3">{empresa.email}</span>}
                  {empresa.localidad && <span>{empresa.localidad}{empresa.provincia ? `, ${empresa.provincia}` : ""}</span>}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Registrada: {new Date(empresa.creado_en).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex gap-2 items-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-primary-600"
                  onClick={() => setSeleccionada(empresa)}>
                  <Eye className="w-4 h-4" />
                </Button>
                {empresa.estado === "pendiente_revision" && (
                  <>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 w-8 p-0"
                      onClick={(e) => handleAprobar(empresa.id, e)} disabled={isPending}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 h-8 w-8 p-0"
                      onClick={(e) => { e.stopPropagation(); setModalRechazo({ id: empresa.id, nombre: empresa.razon_social }); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Slide-over detalle */}
      {seleccionada && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={() => setSeleccionada(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl overflow-y-auto border-l border-slate-200 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {seleccionada.razon_social.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 truncate">{seleccionada.razon_social}</h2>
                  {seleccionada.nombre_comercial && (
                    <p className="text-xs text-slate-500 truncate">{seleccionada.nombre_comercial}</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSeleccionada(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 flex-shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-7">
              {/* Info */}
              <section>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Datos de la empresa</p>
                <dl className="space-y-2">
                  {[
                    ["CUIT", seleccionada.cuit],
                    ["Email", seleccionada.email],
                    ["Teléfono", seleccionada.telefono],
                    ["Localidad", [seleccionada.localidad, seleccionada.provincia].filter(Boolean).join(", ")],
                  ].map(([label, valor]) => valor ? (
                    <div key={label as string} className="flex gap-2 text-sm">
                      <dt className="text-slate-400 w-24 flex-shrink-0">{label}</dt>
                      <dd className="text-slate-800 font-medium">{valor as string}</dd>
                    </div>
                  ) : null)}
                </dl>
              </section>

              {seleccionada.descripcion && (
                <section>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Descripción</p>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl">{seleccionada.descripcion}</p>
                </section>
              )}

              {/* Tarifa */}
              <section>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5" /> Tarifa de Membresía UIAB
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {NIVELES_TARIFA.map((nivel) => {
                    const config = TARIFAS[nivel];
                    const activa = seleccionada.tarifa === nivel;
                    const precioMensual = preciosDb[nivel] ? preciosDb[nivel] : 0;
                    return (
                      <button key={nivel} disabled={isPending}
                        onClick={() => handleTarifa(seleccionada.id, nivel)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          activa ? "border-primary-500 bg-primary-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                        }`}>
                        <p className={`text-sm font-bold mb-0.5 ${activa ? "text-primary-700" : "text-slate-700"}`}>{config.nombre}</p>
                        <p className={`text-xs ${activa ? "text-primary-600" : "text-slate-400"}`}>{formatearPrecioTarifa(precioMensual)}/mes</p>
                      </button>
                    );
                  })}
                </div>
                {!seleccionada.tarifa && (
                  <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">Sin tarifa asignada.</p>
                )}
              </section>

              {seleccionada.motivo_rechazo && (
                <section>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Motivo de rechazo</p>
                  <p className="text-sm text-rose-700 bg-rose-50 p-4 rounded-xl border border-rose-100">{seleccionada.motivo_rechazo}</p>
                </section>
              )}
            </div>

            {/* Footer actions */}
            {seleccionada.estado === "pendiente_revision" && (
              <div className="sticky bottom-0 bg-white/95 border-t border-slate-100 p-5 flex flex-col gap-3">
                {(!seleccionada.estado_suscripcion || seleccionada.estado_suscripcion !== 'activa') && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded-lg text-center">
                    ⚠️ No se puede aprobar: la empresa aún no ha pagado su suscripción.
                  </div>
                )}
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50" 
                    disabled={isPending || seleccionada.estado_suscripcion !== 'activa'}
                    onClick={() => handleAprobar(seleccionada.id)}>
                    <Check className="w-4 h-4 mr-2" /> Aprobar Empresa
                  </Button>
                  <Button variant="outline" className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50" disabled={isPending}
                    onClick={() => setModalRechazo({ id: seleccionada.id, nombre: seleccionada.razon_social })}>
                    <X className="w-4 h-4 mr-2" /> Rechazar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Rechazo */}
      {modalRechazo && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" onClick={() => setModalRechazo(null)} />
          <div className="fixed z-50 inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Rechazar empresa</h3>
              <p className="text-sm text-slate-500 mb-4">
                Ingresá el motivo para rechazar a <strong>{modalRechazo.nombre}</strong>. Se notificará al usuario.
              </p>
              <textarea value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Ej: La documentación presentada está incompleta o vencida."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setModalRechazo(null); setMotivoRechazo(""); }}>
                  Cancelar
                </Button>
                <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" disabled={!motivoRechazo.trim() || isPending}
                  onClick={handleRechazar}>
                  Confirmar rechazo
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
