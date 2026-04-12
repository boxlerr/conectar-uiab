"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wrench, Check, X, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { aprobarProveedor, rechazarProveedor } from "@/modulos/admin/acciones";

type Proveedor = {
  id: string;
  nombre: string;
  apellido: string | null;
  nombre_comercial: string | null;
  tipo_proveedor: string | null;
  cuit: string | null;
  email: string | null;
  telefono: string | null;
  localidad: string | null;
  provincia: string | null;
  descripcion: string | null;
  estado: string;
  motivo_rechazo: string | null;
  creado_en: string;
};

type Filtro = "all" | "pendiente_revision" | "aprobado" | "rechazado";

const BADGE: Record<string, { label: string; className: string }> = {
  aprobado:            { label: "Aprobado", className: "bg-emerald-100 text-emerald-700" },
  pendiente_revision:  { label: "Pendiente", className: "bg-amber-100 text-amber-700" },
  rechazado:           { label: "Rechazado", className: "bg-rose-100 text-rose-700" },
  borrador:            { label: "Borrador", className: "bg-slate-100 text-slate-600" },
  pausado:             { label: "Pausado", className: "bg-orange-100 text-orange-700" },
  oculto:              { label: "Oculto", className: "bg-slate-100 text-slate-500" },
};

export function PanelProveedores({ proveedores }: { proveedores: Proveedor[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filtro, setFiltro] = useState<Filtro>("pendiente_revision");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState<Proveedor | null>(null);
  const [modalRechazo, setModalRechazo] = useState<{ id: string; nombre: string } | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  const nombreCompleto = (p: Proveedor) =>
    [p.nombre, p.apellido].filter(Boolean).join(" ");

  const filtrados = proveedores.filter((p) => {
    const matchFiltro = filtro === "all" || p.estado === filtro;
    const nombre = nombreCompleto(p).toLowerCase();
    const matchBusqueda = !busqueda ||
      nombre.includes(busqueda.toLowerCase()) ||
      (p.nombre_comercial ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.email ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.cuit ?? "").includes(busqueda);
    return matchFiltro && matchBusqueda;
  });

  const counts = {
    all: proveedores.length,
    pendiente_revision: proveedores.filter((p) => p.estado === "pendiente_revision").length,
    aprobado: proveedores.filter((p) => p.estado === "aprobado").length,
    rechazado: proveedores.filter((p) => p.estado === "rechazado").length,
  };

  function refresh() { startTransition(() => router.refresh()); }

  async function handleAprobar(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    await aprobarProveedor(id);
    refresh();
    if (seleccionado?.id === id) setSeleccionado(prev => prev ? { ...prev, estado: "aprobado" } : null);
  }

  async function handleRechazar() {
    if (!modalRechazo || !motivoRechazo.trim()) return;
    await rechazarProveedor(modalRechazo.id, motivoRechazo);
    setModalRechazo(null);
    setMotivoRechazo("");
    refresh();
    if (seleccionado?.id === modalRechazo.id) setSeleccionado(null);
  }

  const TABS: { key: Filtro; label: string }[] = [
    { key: "pendiente_revision", label: `Pendientes (${counts.pendiente_revision})` },
    { key: "aprobado", label: `Aprobados (${counts.aprobado})` },
    { key: "rechazado", label: `Rechazados (${counts.rechazado})` },
    { key: "all", label: `Todos (${counts.all})` },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Wrench className="w-8 h-8 text-emerald-600" />
          Gestión de Proveedores
        </h1>
        <p className="text-slate-500 mt-1">Aprobá o rechazá los perfiles de proveedores de servicios.</p>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-center shadow-sm border-slate-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, CUIT o email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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

      <div className="space-y-3">
        {filtrados.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hay proveedores con este filtro.</p>
          </div>
        ) : filtrados.map((prov) => {
          const badge = BADGE[prov.estado] ?? { label: prov.estado, className: "bg-slate-100 text-slate-600" };
          return (
            <Card key={prov.id}
              className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-sm border-slate-100 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group"
              onClick={() => setSeleccionado(prov)}>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-lg flex-shrink-0">
                {prov.nombre.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {nombreCompleto(prov)}
                  </h3>
                  {prov.nombre_comercial && (
                    <span className="text-xs text-slate-400">· {prov.nombre_comercial}</span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500 truncate">
                  {prov.tipo_proveedor && <span className="mr-3 font-medium">{prov.tipo_proveedor}</span>}
                  {prov.cuit && <span className="mr-3">CUIT: {prov.cuit}</span>}
                  {prov.localidad && <span>{prov.localidad}{prov.provincia ? `, ${prov.provincia}` : ""}</span>}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Registrado: {new Date(prov.creado_en).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex gap-2 items-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-emerald-600" onClick={() => setSeleccionado(prov)}>
                  <Eye className="w-4 h-4" />
                </Button>
                {prov.estado === "pendiente_revision" && (
                  <>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 w-8 p-0"
                      onClick={(e) => handleAprobar(prov.id, e)} disabled={isPending}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 h-8 w-8 p-0"
                      onClick={(e) => { e.stopPropagation(); setModalRechazo({ id: prov.id, nombre: nombreCompleto(prov) }); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Slide-over */}
      {seleccionado && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={() => setSeleccionado(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl overflow-y-auto border-l border-slate-200 animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
                  {seleccionado.nombre.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 truncate">{nombreCompleto(seleccionado)}</h2>
                  {seleccionado.tipo_proveedor && (
                    <p className="text-xs text-emerald-600">{seleccionado.tipo_proveedor}</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSeleccionado(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 flex-shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <section>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Datos del proveedor</p>
                <dl className="space-y-2">
                  {[
                    ["CUIT", seleccionado.cuit],
                    ["Email", seleccionado.email],
                    ["Teléfono", seleccionado.telefono],
                    ["Localidad", [seleccionado.localidad, seleccionado.provincia].filter(Boolean).join(", ")],
                    ["Tipo", seleccionado.tipo_proveedor],
                  ].map(([label, valor]) => valor ? (
                    <div key={label as string} className="flex gap-2 text-sm">
                      <dt className="text-slate-400 w-24 flex-shrink-0">{label}</dt>
                      <dd className="text-slate-800 font-medium">{valor as string}</dd>
                    </div>
                  ) : null)}
                </dl>
              </section>
              {seleccionado.descripcion && (
                <section>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Descripción</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl leading-relaxed">{seleccionado.descripcion}</p>
                </section>
              )}
              {seleccionado.motivo_rechazo && (
                <section>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Motivo de rechazo</p>
                  <p className="text-sm text-rose-700 bg-rose-50 p-4 rounded-xl border border-rose-100">{seleccionado.motivo_rechazo}</p>
                </section>
              )}
            </div>

            {seleccionado.estado === "pendiente_revision" && (
              <div className="sticky bottom-0 bg-white/95 border-t border-slate-100 p-5 flex gap-3">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isPending}
                  onClick={() => handleAprobar(seleccionado.id)}>
                  <Check className="w-4 h-4 mr-2" /> Aprobar
                </Button>
                <Button variant="outline" className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50" disabled={isPending}
                  onClick={() => setModalRechazo({ id: seleccionado.id, nombre: nombreCompleto(seleccionado) })}>
                  <X className="w-4 h-4 mr-2" /> Rechazar
                </Button>
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
              <h3 className="text-lg font-bold text-slate-900 mb-1">Rechazar proveedor</h3>
              <p className="text-sm text-slate-500 mb-4">
                Ingresá el motivo para rechazar a <strong>{modalRechazo.nombre}</strong>.
              </p>
              <textarea value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Ej: Las certificaciones presentadas no son válidas."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
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
