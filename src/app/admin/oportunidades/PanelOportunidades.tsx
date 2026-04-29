"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, X, Search, XCircle, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cerrarOportunidad, eliminarOportunidad } from "@/modulos/admin/acciones";

type Oportunidad = {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  visibilidad: string | null;
  localidad: string | null;
  fecha_necesidad: string | null;
  creado_en: string;
  empresa?: { razon_social: string } | null;
  categoria?: { nombre: string } | null;
};

type Filtro = "all" | "abierta" | "cerrada";

const BADGE: Record<string, { label: string; className: string }> = {
  abierta:  { label: "Abierta", className: "bg-emerald-100 text-emerald-700" },
  cerrada:  { label: "Cerrada", className: "bg-slate-100 text-slate-600" },
  en_proceso: { label: "En Proceso", className: "bg-blue-100 text-blue-700" },
};

export function PanelOportunidades({ oportunidades }: { oportunidades: Oportunidad[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filtro, setFiltro] = useState<Filtro>("abierta");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionada, setSeleccionada] = useState<Oportunidad | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null);

  const filtradas = oportunidades.filter((op) => {
    const matchFiltro = filtro === "all" || op.estado === filtro;
    const matchBusqueda = !busqueda ||
      op.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (op.empresa?.razon_social ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (op.localidad ?? "").toLowerCase().includes(busqueda.toLowerCase());
    return matchFiltro && matchBusqueda;
  });

  const counts = {
    all: oportunidades.length,
    abierta: oportunidades.filter((op) => op.estado === "abierta").length,
    cerrada: oportunidades.filter((op) => op.estado === "cerrada").length,
  };

  function refresh() { startTransition(() => router.refresh()); }

  async function handleCerrar(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    await cerrarOportunidad(id);
    refresh();
    if (seleccionada?.id === id) setSeleccionada(prev => prev ? { ...prev, estado: "cerrada" } : null);
  }

  async function handleEliminar() {
    if (!confirmarEliminar) return;
    await eliminarOportunidad(confirmarEliminar);
    setConfirmarEliminar(null);
    refresh();
    if (seleccionada?.id === confirmarEliminar) setSeleccionada(null);
  }

  const TABS: { key: Filtro; label: string }[] = [
    { key: "abierta", label: `Abiertas (${counts.abierta})` },
    { key: "cerrada", label: `Cerradas (${counts.cerrada})` },
    { key: "all", label: `Todas (${counts.all})` },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-violet-600" />
          Gestión de Oportunidades
        </h1>
        <p className="text-slate-500 mt-1">Administrá las oportunidades publicadas por empresas y proveedores de servicios.</p>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-center shadow-sm border-slate-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por título, empresa o localidad..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
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
        {filtradas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hay oportunidades con este filtro.</p>
          </div>
        ) : filtradas.map((op) => {
          const badge = BADGE[op.estado] ?? { label: op.estado, className: "bg-slate-100 text-slate-600" };
          return (
            <Card key={op.id}
              className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-sm border-slate-100 hover:shadow-md hover:border-violet-200 transition-all cursor-pointer group"
              onClick={() => setSeleccionada(op)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-slate-900 group-hover:text-violet-700 transition-colors truncate">
                    {op.titulo}
                  </h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500 truncate">
                  {op.empresa?.razon_social && <span className="mr-3 font-medium">{op.empresa.razon_social}</span>}
                  {op.categoria?.nombre && <span className="mr-3">{op.categoria.nombre}</span>}
                  {op.localidad && <span>{op.localidad}</span>}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Publicada: {new Date(op.creado_en).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                  {op.fecha_necesidad && ` · Necesidad: ${new Date(op.fecha_necesidad).toLocaleDateString("es-AR")}`}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-violet-600"
                  onClick={() => setSeleccionada(op)}>
                  <Eye className="w-4 h-4" />
                </Button>
                {op.estado === "abierta" && (
                  <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                    onClick={(e) => handleCerrar(op.id, e)} disabled={isPending}>
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Cerrar
                  </Button>
                )}
                <Button size="sm" variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 h-8 w-8 p-0"
                  onClick={(e) => { e.stopPropagation(); setConfirmarEliminar(op.id); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Slide-over */}
      {seleccionada && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={() => setSeleccionada(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl overflow-y-auto border-l border-slate-200 animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 truncate">{seleccionada.titulo}</h2>
                  <p className="text-xs text-violet-600">{seleccionada.empresa?.razon_social ?? "Sin empresa"}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSeleccionada(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 flex-shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <section>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Detalles</p>
                <dl className="space-y-2 text-sm">
                  {[
                    ["Estado", seleccionada.estado],
                    ["Categoría", seleccionada.categoria?.nombre],
                    ["Localidad", seleccionada.localidad],
                    ["Visibilidad", seleccionada.visibilidad],
                    ["Fecha necesidad", seleccionada.fecha_necesidad ? new Date(seleccionada.fecha_necesidad).toLocaleDateString("es-AR") : null],
                    ["Publicada", new Date(seleccionada.creado_en).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })],
                  ].map(([label, valor]) => valor ? (
                    <div key={label as string} className="flex gap-2">
                      <dt className="text-slate-400 w-28 flex-shrink-0">{label}</dt>
                      <dd className="text-slate-800 font-medium">{valor as string}</dd>
                    </div>
                  ) : null)}
                </dl>
              </section>
              {seleccionada.descripcion && (
                <section>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Descripción</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl leading-relaxed">{seleccionada.descripcion}</p>
                </section>
              )}
            </div>
            <div className="sticky bottom-0 bg-white/95 border-t border-slate-100 p-5 flex gap-3">
              {seleccionada.estado === "abierta" && (
                <Button className="flex-1 bg-slate-700 hover:bg-slate-800 text-white" disabled={isPending}
                  onClick={() => handleCerrar(seleccionada.id)}>
                  <XCircle className="w-4 h-4 mr-2" /> Cerrar oportunidad
                </Button>
              )}
              <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" disabled={isPending}
                onClick={() => setConfirmarEliminar(seleccionada.id)}>
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Modal confirmar eliminar */}
      {confirmarEliminar && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" onClick={() => setConfirmarEliminar(null)} />
          <div className="fixed z-50 inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-1">¿Eliminar oportunidad?</h3>
              <p className="text-sm text-slate-500 text-center mb-6">Esta acción es irreversible. Se eliminarán también los matches asociados.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmarEliminar(null)}>Cancelar</Button>
                <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" disabled={isPending}
                  onClick={handleEliminar}>
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
