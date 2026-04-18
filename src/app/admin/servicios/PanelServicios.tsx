"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tags, Plus, Search, Edit2, CheckCircle2, XCircle, Trash2, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  crearCategoria,
  editarCategoria,
  toggleActivarCategoria,
  eliminarCategoria,
} from "@/modulos/admin/acciones";

type Servicio = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  activa: boolean;
  creado_en: string;
};

export function PanelServicios({ servicios }: { servicios: Servicio[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState("");
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [servicioEnEdicion, setServicioEnEdicion] = useState<Servicio | null>(null);
  const [servicioAEliminar, setServicioAEliminar] = useState<Servicio | null>(null);
  
  // Form states
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const filtrados = servicios.filter((s) => {
    return (
      s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (s.descripcion ?? "").toLowerCase().includes(busqueda.toLowerCase())
    );
  });

  function refresh() {
    startTransition(() => router.refresh());
  }

  function handleOpenCrear() {
    setServicioEnEdicion(null);
    setNombre("");
    setDescripcion("");
    setModalOpen(true);
  }

  function handleOpenEditar(servicio: Servicio) {
    setServicioEnEdicion(servicio);
    setNombre(servicio.nombre);
    setDescripcion(servicio.descripcion || "");
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
  }

  async function handleSumbit() {
    if (!nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    
    if (servicioEnEdicion) {
      const res = await editarCategoria(servicioEnEdicion.id, nombre, descripcion);
      if (res.error) {
        toast.error("Error al editar", { description: res.error });
      } else {
        toast.success("Servicio actualizado correctamente");
        handleCloseModal();
        refresh();
      }
    } else {
      const res = await crearCategoria(nombre, descripcion);
      if (res.error) {
        toast.error("Error al crear", { description: res.error });
      } else {
        toast.success("Servicio creado correctamente");
        handleCloseModal();
        refresh();
      }
    }
  }

  async function handleConfirmarEliminar() {
    if (!servicioAEliminar) return;
    const res = await eliminarCategoria(servicioAEliminar.id);
    if (res.error) {
      toast.error("No se pudo eliminar", { description: res.error });
    } else {
      toast.success(`"${servicioAEliminar.nombre}" eliminado`);
      setServicioAEliminar(null);
      refresh();
    }
  }

  async function handleToggle(id: string, activaActual: boolean) {
    const res = await toggleActivarCategoria(id, !activaActual);
    if (res.error) {
      toast.error("Error al cambiar estado", { description: res.error });
    } else {
      toast.success(`Servicio ${!activaActual ? "activado" : "desactivado"} correctamente`);
      refresh();
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Tags className="w-8 h-8 text-primary-600" />
            Servicios y Especialidades
          </h1>
          <p className="text-slate-500 mt-1">
            Administrá el catálogo oficial de servicios disponibles para la red.
          </p>
        </div>
        <Button onClick={handleOpenCrear} className="pl-3 bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nuevo Servicio
        </Button>
      </div>

      <Card className="p-4 flex gap-3 shadow-sm border-slate-100">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
          />
        </div>
      </Card>

      <div className="space-y-3">
        {filtrados.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <Tags className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No se encontraron servicios.</p>
          </div>
        ) : (
          filtrados.map((servicio) => (
            <Card key={servicio.id} className={`p-5 flex flex-col sm:flex-row gap-4 sm:items-center shadow-sm border-slate-100 transition-all ${
              !servicio.activa ? "opacity-75 bg-slate-50" : ""
            }`}>
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                {servicio.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-900 truncate">
                    {servicio.nombre}
                  </h3>
                  {servicio.activa ? (
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Activo
                    </span>
                  ) : (
                    <span className="bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 line-clamp-1">{servicio.descripcion || "Sin descripción proporcionada."}</p>
                <div className="text-xs text-slate-400 mt-2 flex gap-3">
                  <span>Slug: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-500">{servicio.slug}</span></span>
                  <span>Creado: {new Date(servicio.creado_en).toLocaleDateString("es-AR")}</span>
                </div>
              </div>

              <div className="flex gap-2 items-center sm:pl-4 sm:border-l sm:border-slate-100 mt-2 sm:mt-0">
                <Button variant="ghost" size="sm" onClick={() => handleOpenEditar(servicio)} className="text-slate-500 hover:text-primary-600 hover:bg-primary-50" title="Editar">
                  <Edit2 className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setServicioAEliminar(servicio)}
                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-2 px-2" title={servicio.activa ? "Desactivar" : "Activar"}>
                  <Switch
                    checked={servicio.activa}
                    onCheckedChange={() => handleToggle(servicio.id, servicio.activa)}
                    disabled={isPending}
                  />
                  <span className="text-xs font-semibold text-slate-500 w-10">{servicio.activa ? "ON" : "OFF"}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {servicioAEliminar && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={() => setServicioAEliminar(null)} />
          <div className="fixed z-50 inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-900">Eliminar servicio</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      ¿Seguro que querés eliminar <span className="font-semibold">"{servicioAEliminar.nombre}"</span>? Esta acción no se puede deshacer.
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Si hay proveedores o empresas vinculados, no se podrá eliminar y te conviene desactivarlo en su lugar.
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setServicioAEliminar(null)} disabled={isPending} className="font-semibold text-slate-600">
                  Cancelar
                </Button>
                <Button onClick={handleConfirmarEliminar} disabled={isPending} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold min-w-[100px]">
                  {isPending ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={handleCloseModal} />
          <div className="fixed z-50 inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">
                  {servicioEnEdicion ? "Editar Servicio" : "Crear Nuevo Servicio"}
                </h3>
                <Button variant="ghost" size="icon" onClick={handleCloseModal} className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-5">
                {!servicioEnEdicion && (
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-start gap-3 border border-blue-100">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
                    <p className="text-xs leading-relaxed">
                      El "slug" (identificador URL) se generará automáticamente en base al nombre elegido, en minúsculas y sin acentos.
                    </p>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre del Servicio <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      value={nombre} 
                      onChange={e => setNombre(e.target.value)}
                      placeholder="Ej: Tornería CNC"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all font-medium placeholder:font-normal placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descripción (Opcional)</label>
                    <textarea 
                      value={descripcion} 
                      onChange={e => setDescripcion(e.target.value)}
                      placeholder="Una breve descripción opcional sobre qué incluye este servicio o especialidad..."
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <Button variant="outline" onClick={handleCloseModal} disabled={isPending} className="font-semibold text-slate-600">
                  Cancelar
                </Button>
                <Button onClick={handleSumbit} disabled={isPending || !nombre.trim()} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-sm min-w-[120px]">
                  {isPending ? "Guardando..." : "Guardar Servicio"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
