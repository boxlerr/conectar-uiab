"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PackageSearch } from "lucide-react";
import { createItem, updateItem } from "./acciones";
import { toast } from "sonner";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";

interface FormularioItemProps {
  itemInit?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FormularioItem({ itemInit, onSuccess, onCancel }: FormularioItemProps) {
  const { currentUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    titulo: itemInit?.titulo || "",
    descripcion: itemInit?.descripcion || "",
    precio: itemInit?.precio || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.entityId) return;

    if (!formData.titulo.trim()) {
      toast.error("El nombre del servicio/producto es obligatorio.");
      return;
    }

    setSaving(true);
    let res;

    if (itemInit?.id) {
      // Edit
      res = await updateItem(itemInit.id, {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        precio: formData.precio ? Number(formData.precio) : undefined,
      });
    } else {
      // Create
      res = await createItem(
        currentUser.role as 'company' | 'provider',
        currentUser.entityId,
        {
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          precio: formData.precio ? Number(formData.precio) : undefined,
        }
      );
    }

    if (res?.error) {
      toast.error("Error al guardar", { description: res.error });
    } else {
      toast.success(itemInit ? "Actualizado con éxito" : "Creado con éxito");
      onSuccess();
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
          <PackageSearch className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {itemInit ? "Editar Ítem" : "Nuevo Producto o Servicio"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Completa los detalles para publicarlo en tu catálogo.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Nombre del Servicio o Producto <span className="text-rose-500">*</span></label>
          <input
            type="text"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-400"
            placeholder="Ej. Tornería Cilíndrica Convencional"
            value={formData.titulo}
            onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Descripción Detallada</label>
          <textarea
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all min-h-[100px] resize-none placeholder:text-slate-400"
            placeholder="Especificaciones técnicas, capacidades, tiempos de entrega..."
            value={formData.descripcion}
            onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Precio de Referencia (Opcional)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
            <input
              type="number"
              className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-400"
              placeholder="0.00"
              value={formData.precio}
              onChange={(e) => setFormData(prev => ({ ...prev, precio: e.target.value }))}
            />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving} className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
            Cancelar
          </Button>
          <Button type="submit" disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white min-w-[120px] shadow-[0_4px_12px_rgba(14,165,233,0.25)] border-none">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {itemInit ? "Guardar Cambios" : "Crear Ítem"}
          </Button>
        </div>
      </form>
    </div>
  );
}
